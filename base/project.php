<?php
/*
<NPT, a web development framework.>
Copyright (C) <2009>  <NPT>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
if (!defined('XFS')) exit;

abstract class project
{
	protected function advanced_search($category)
	{
		global $user;
		
		$z = $this->__(array('_table' => array(0), '_field' => array(0), '_input' => array(''), '_vbox' => array(0)));
		
		foreach ($z['_input'] as $i => $row)
		{
			if (!isset($z['_vbox'][$i]))
			{
				$z['_vbox'][$i] = 0;
			}
			
			if ($row === '') {
				unset($z['_input'][$i], $z['_table'][$i], $z['_field'][$i], $z['_vbox'][$i]);
			}
		}
		ksort($z['_vbox']);
		
		$sql = 'SELECT *
			FROM _search_relation r, _search_tables t, _search_categories c
			WHERE r.relation_id IN (' . _implode(',', $z['_field']) . ")
				AND r.relation_table = t.table_id
				AND t.table_cat = c.category_id
				AND c.category_alias = ?
			ORDER BY r.relation_field";
		if (!$relation = _rowset(sql_filter($sql, $category)))
		{
			return $this->e('NO_TABLE_FIELDS');
		}
		
		$a_where = $a_where2 = $a_from = $a_cals = $ref = w();
		$i_vbox = $i_and = 0;
		$s_open = false;
		
		foreach ($z['_field'] as $i => $row)
		{
			$ref[$row][] = $z['_input'][$i];
		}
		
		foreach ($relation as $row)
		{
			$e_tables = array_map('trim', explode(',', trim($row['relation_tables'])));
			foreach ($e_tables as $e_row)
			{
				if (!in_array($e_row, $a_from))
				{
					$a_from[] = _escape($e_row);
				}
			}
			
			$e_fields = array_map('trim', explode(',', trim($row['relation_fields'])));
			foreach ($e_fields as $e_row)
			{
				if (!f($e_row)) continue;
				
				if (!in_array($e_row, $a_where)) $a_where[] = (($i_and) ? ' AND ' : '') . $e_row;
				$i_and++;
			}
			
			if (isset($ref[$row['relation_id']]))
			{
				foreach ($ref[$row['relation_id']] as $q => $e_row)
				{
					$s_sign = 'LIKE';
					if ($row['relation_input'] == 'calendar')
					{
						if (isset($a_cals[$row['relation_field']]))
						{
							$e_endcal = explode('/', $e_row);
							$e_row = _timestamp($e_endcal[1], $e_endcal[0], $e_endcal[2], 23, 59, 59);
							$s_sign = '<=';
							
							unset($a_cals[$row['relation_field']]);
						}
						else
						{
							$e_row = $this->parse_calendar('calendar', $e_row);
							$s_sign = '>=';
							$a_cals[$row['relation_field']] = 1;
						}
					}
					
					$a_where2[] = (($z['_vbox'][$i_vbox]) ? 'AND' : 'OR') . ' ' . $row['relation_field'] . " " . $s_sign . " '" . _escape(str_replace('+', '%', $e_row)) . "'";
					$i_vbox++;
				}
			}
		}
		
		$a_where_count = count($a_where2);
		$section = false;
		foreach ($a_where2 as $i => $row)
		{
			$and = (strpos($row, 'AND ') !== false);
			$and_prev = (isset($a_where2[$i - 1]) && strpos($a_where2[$i - 1], 'AND ') !== false);
			$and_next = (isset($a_where2[$i + 1]) && strpos($a_where2[$i + 1], 'AND ') !== false);
			$last = ($i + 1 == $a_where_count);
			$last_next = ($i + 2 == $a_where_count);
			$prev_first = !($i - 1);
			
			$row = str_replace(array('AND ', 'OR '), '', $row);
			
			if (!$section && (!$i || ($and && !$and_prev && !$last) || ($and && !$and_prev && !$and_next && !$last) || (!$and && $and_next) || ($and && $and_prev && !$and_next)))
			{
				$row = '(' . $row;
				$section = true;
			}
			
			$row = (($and) ? 'AND' : 'OR') . ' ' . $row;
			
			if ($section && (($last) || ($and && $and_prev && $and_next) || ($and && $and_prev && !$and_next && !$last_next) || (!$and && $and_prev && $last_next && $prev_first) || ($i && $and && !$and_prev) || ($last && !$and && $and_prev)))
			{
				$row .= ')';
				$section = false;
			}
			
			$a_where2[$i] = $row;
		}
		
		if ($category == 'ticket')
		{
			$groups = $user->auth_groups();
			if (/*_auth_get('ticket_view_all') && */$groups != -1)
			{
				$a_where2[] = 'AND t.ticket_group IN (' . $groups . ') ';
			}
			else
			{
				$a_where2[] = 'AND t.ticket_contact = ' . (int) $user->v('user_id');
			}
		}
		
		if (!count($a_where))
		{
			$a_where2[0] = preg_replace('#^(AND|OR) (.*?)#i', '\2', $a_where2[0]);
		}
		
		if (count($a_where) == 1)
		{
			$a_where2[0] = preg_replace('#^OR (.*?)#i', 'AND \2', $a_where2[0]);
		}
		
		return array(
			'from' => $a_from,
			'where' => array_merge($a_where, $a_where2)
		);
	}
	
	protected function advanced_search_form($category)
	{
		global $user;
		
		$sql = "SELECT *
			FROM _search_tables t, _search_categories c
			WHERE t.table_cat = c.category_id
				AND c.category_alias = ?
			ORDER BY table_id";
		$tables = _rowset(sql_filter($sql, $category));
		
		foreach ($tables as $i => $row)
		{
			// TODO: Create components_features
			if ($row['table_alias'] == 'components_features')
			{
				continue;
			}
			
			_style('search_tables', array(
				'V_VALUE' => $row['table_id'],
				'V_NAME' => _lang('TABLES_' . $row['table_alias']))
			);
			
			if (!$i) {
				$sql = 'SELECT *
					FROM _search_relation
					WHERE relation_table = ?';
				$relation = _rowset(sql_filter($sql, $row['table_id']));
				
				foreach ($relation as $row2)
				{
					if ($row2['relation_name'] == 'Grupo')
					{
						$groups = explode(',', $user->auth_groups());
						
						if (count($groups) < 2)
						{
							continue;
						}
					}
					
					_style('relation_field', array(
						'V_VALUE' => $row2['relation_id'],
						'V_NAME' => $row2['relation_name'])
					);
				}
			}
		}
	
		return;
	}
	
	protected function computer_field($value, $field, $error = '')
	{
		if (!f($value) || !f($field))
		{
			return false;
		}
		
		$sql = 'SELECT c.a_id
			FROM _computer c, _computer_fields f
			WHERE c.a_value = ?
				AND f.field_alias = ?
				AND c.a_field = f.field_id';
		if (_fieldrow(sql_filter($sql, $value, $field)))
		{
			if (f($error))
			{
				$this->_error($error, false);
			}
			return false;
		}
		return true;
	}
	
	protected function _relation_value(&$row)
	{
		if (!isset($row['field_relation']))
		{
			return;
		}
		
		if (f($row['field_relation']))
		{
			$e_rel = explode('.', $row['field_relation']);
			
			$sql = 'SELECT ??, ??
				FROM _??
				WHERE ?? = ?
				ORDER BY ?';
			$row['a_value'] = _field(sql_filter($sql, $e_rel[1], $e_rel[2], $e_rel[0], $e_rel[1], $row['a_value'], $e_rel[1]), $e_rel[2], $row['a_value']);
		}
		
		return;
	}
	
	protected function field_types()
	{
		return w('text textarea checkbox select calendar');
	}
	
	protected function nobody()
	{
		global $core;
		
		if (!$no_body = $core->cache_load('no_body', true))
		{
			$sql = 'SELECT *
				FROM _members
				WHERE user_username = ?';
			$no_body = $core->cache_store(_fieldrow(sql_filter($sql, 'nobody')), false, true);
		}
		return $no_body;
	}
	
	protected function parse_calendar($field, &$value)
	{
		switch ($field)
		{
			case 'calendar':
				$e = explode('/', $value);
				$value = _timestamp($e[1], $e[0], $e[2]);
				break;
		}
		return $value;
	}
	
	protected function to_calendar($field, &$value)
	{
		switch ($field)
		{
			case 'calendar':
				$value = _format_date($value, 'd/m/Y');
				break;
		}
		return $value;
	}
	
	protected function is_mac($mac)
	{
		return preg_match('/^([0-9A-Z][0-9A-Z]:){5}[0-9A-Z][0-9A-Z]$/i', $mac);
	}
	
	protected function is_date($date)
	{
		return preg_match('#^(\d+)\/(\d+)\/(\d+){4}$#is', $date);
	}
}

?>