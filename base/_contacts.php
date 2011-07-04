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

class __contacts extends xmd
{
	public function __construct()
	{
		parent::__construct();
		
		$this->_m(array(
			'all' => w(),
			'create' => array('dept', 'position', 'value' => w('member')),
			'search' => w('table field'),
			'edit' => w('contact dept position'),
			'delete' => w(),
			'authorize' => w('field value founder check'),
			'group' => w('create remove'),
			'tab' => w(),
			'mfield' => w('create'),
			'value' => array('call', 'create' => w('query'), 'modify', 'remove'),
			'remove' => w(),
			'groups' => w('create call modify remove'))
		);
	}
	
	private function init_mtype()
	{
		global $core;
		
		if (!$mtype = $core->cache_load('members_type'))
		{
			$sql = 'SELECT *
				FROM _members_type
				ORDER BY type_order';
			$mtype = $core->cache_store(_rowset($sql, 'type_alias'));
		}
		return $mtype;
	}
	
	private function init_tabs()
	{
		global $core;
		
		if (!$tabs = $core->cache_load('members_tab'))
		{
			$sql = 'SELECT *
				FROM _members_tabs
				ORDER BY tab_order';
			$tabs = $core->cache_store(_rowset($sql, 'tab_alias'));
		}
		return $tabs;
	}
	
	public function home()
	{
		$v = $this->__(array('m'));
		
		$u_args = array('x1' => 'search');
		if ($v['m']) {
			$u_args['m'] = $v['m'];
		}
		
		return redirect(_link($this->m(), $u_args));
	}
	
	public function all()
	{
		$this->method();
	}
	
	protected function _all_home()
	{
		/*$sql = 'SELECT c.this_name, m.user_username, m.user_firstname, m.user_lastname, m.user_email
			FROM _members m, _members_store s, _members_fields f, _members_ctype c
			WHERE f.field_id = s.a_field
				AND s.a_assoc = m.user_id
				AND f.field_alias = ?
				AND s.a_value = c.this_id
			ORDER BY c.this_name, m.user_lastname, m.user_firstname';*/
		$sql = 'SELECT this_name, user_username, user_firstname, user_lastname, user_email
			FROM _members
			INNER JOIN _members_fields ON field_id = a_field
				WHERE field_alias = ?
			INNER JOIN _members_store ON a_assoc = user_id
			INNER JOIN _members_ctype ON this_id = a_value
			ORDER BY this_name, user_lastname, user_firstname';
		$contacts = _rowset(sql_filter($sql, 'ctype'), 'this_name', false, true);
		
		$response = '';
		foreach ($contacts as $i => $row)
		{
			$response .= '<h1>' . $i . '</h1><br /><table border="1">';
			
			foreach ($row as $j => $row2)
			{
				$response .= '<tr>
				<td>' . $row2['user_lastname'] . ', ' . $row2['user_firstname'] . '</td>
				<td>' . $row2['user_username'] . '</td>
				<td>' . $row2['user_email'] . '</td>
				</tr>';
			}
			
			$response .= '</table>';
		}
		
		return $this->e($response);
	}
	
	public function create()
	{
		$this->nav();
		return $this->method();
	}
	
	protected function _create_home()
	{
		global $user, $core;
		
		if (_button())
		{
			gfatal();
			
			$v = $this->__(array('autos' => 0, 'active' => 0, 'type' => 0, 'admin' => 0, 'firstname', 'lastname', 'show', 'username', 'gender', 'email', 'password'), 'contact');
			$v['contact_username'] = _alias($v['contact_username']);
			
			$sql = 'SELECT user_id
				FROM _members
				WHERE user_username = ?
					AND user_active = 1';
			if (_fieldrow(sql_filter($sql, $v['contact_username'])))
			{
				$this->_error('#USERNAME_EXISTS');
			}
			
			$internal = 0;
			if ($v['contact_type'] == 4)
			{
				$internal = 1;
			}
			
			$type = 0;
			if ($v['contact_admin'] && $internal)
			{
				$type = 3;
			}
			
			$sql_insert = array(
				'type' => $type,
				'active' => $v['contact_active'],
				'internal' => $internal,
				'mtype' => (int) $v['contact_type'],
				'login' => $v['contact_username'],
				'username' => $v['contact_username'],
				'firstname' => $v['contact_firstname'],
				'lastname' => $v['contact_lastname'],
				'password' => _password($v['contact_password']),
				'name_show' => $v['contact_show'],
				'email' => (f($v['contact_email'])) ? $v['contact_email'] : $v['contact_username'] . '@' . $core->v('domain'),
				'gender' => $v['contact_gender'],
				'date' => time(),
				'dateformat' => 'd M Y H:i',
				'timezone' => -6
			);
			$sql = 'INSERT INTO _members' . _build_array('INSERT', prefix('user', $sql_insert));
			$v['uid'] = _sql_nextid($sql);
			
			foreach (w('index ticket ticket_create ticket_view_own ticket_mini chat') as $row)
			{
				$user->auth_update($row, true, $v['uid']);
			}
			
			redirect(_link($this->m(), array('x1' => 'search', 'm' => $v['contact_username'])));
		}
		
		$mtype = $this->init_mtype();
		foreach ($mtype as $row)
		{
			_style('contact_type', array(
				'ID' => $row['type_id'],
				'NAME' => $row['type_name'])
			);
		}
		
		return;
	}
	
	public function mfield()
	{
		return $this->method();
	}
	
	protected function _mfield_home()
	{
		_fatal();
	}
	
	protected function _mfield_create()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('alias', 'display', 'type', 'required' => 0, 'unique' => 0, 'show' => 0));
		
		$sql = 'SELECT *
			FROM _members_fields
			WHERE field_alias = ?';
		if (_fieldrow(sql_filter($sql, $v['alias'])))
		{
			$this->_error('FIELD_EXISTS');
		}
		
		$v['name'] = $v['alias'];
		$sql = 'INSERT INTO _members_fields' . _build_array('INSERT', prefix('field', $v));
		_sql($sql);
		
		$core->cache_unload();
			
		return $this->e('~OK');
	}
	
	public function value()
	{
 		return $this->method();
	}
	
	protected function _value_create()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('uid' => 0, 'field_id' => 0, '_input' => array('')));
		$v['_input'] = array_values($v['_input']);
		$v['value'] = $v['_input'][0];
		
		$sql = 'SELECT *
			FROM _members_fields
			WHERE field_id = ?';
		if (!$field = _fieldrow(sql_filter($sql, $v['field_id'])))
		{
			$this->_error('#FIELD_NO_EXISTS');
		}
		
		$sql = 'SELECT *
			FROM _members
			WHERE user_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('#TICKET_NOT_MEMBER');
		}
		
		if ($field['field_unique'])
		{
			$sql = 'SELECT *
				FROM _??
				WHERE a_field = ?
					AND a_value = ?';
			if (_fieldrow(sql_filter($sql, $v['is'], $v['field_id'], $v['value'])))
			{
				$this->_error('#FIELD_DUPLICATE');
			}
		}
		
		if (f($field['field_relation']))
		{
			$e_relation = explode('.', $field['field_relation']);
			
			$sql = 'SELECT ??
				FROM _??
				WHERE ?? = ?';
			if (!_fieldrow(sql_filter($sql, $e_relation[1], $e_relation[0], $e_relation[1], $v['value'])))
			{
				$this->_error('#FIELD_NO_EXISTS');
			}
		}
		
		switch ($field['field_alias'])
		{
			case 'status':
				$sql = 'SELECT status_ext
					FROM _members_status
					WHERE status_id = ?';
				$status_ext = _field(sql_filter($sql, $v['value']), 'status_ext', 0);
				
				$sql = 'UPDATE _members SET user_active = ?
					WHERE user_id = ?';
				_sql(sql_filter($sql, $status_ext, $v['uid']));
				break;
			case 'carnet':
				if (!$field_ctype = $core->cache_load('members_field_ctype'))
				{
					$sql = 'SELECT field_id
						FROM _members_fields
						WHERE field_alias = ?';
					$field_ctype = $core->cache_store(_field(sql_filter($sql, 'ctype'), 'field_id'));
				}
				
				$sql = 'SELECT a_value
					FROM _members_store
					WHERE a_assoc = ?
						AND a_field = ?';
				if (!$uid_ctype = _field(sql_filter($sql, $v['uid'], $field_ctype), 'a_value'))
				{
					$this->_error('#FIELD_FIRST_CTYPE');
				}
				
				$sql = 'SELECT a_assoc
					FROM _members_store
					WHERE a_field = ?
						AND a_value = ?
						AND a_assoc <> ?';
				if ($a_assoc = _field(sql_filter($sql, $v['field_id'], $v['value'], $v['uid']), 'a_assoc'))
				{
					$sql = 'SELECT a_id
						FROM _members_store
						WHERE a_assoc = ?
							AND a_field = ?
							AND a_value = ?';
					if ($field_ctype = _field(sql_filter($sql, $a_assoc, $field_ctype, $uid_ctype), 'a_id'))
					{
						$this->_error('#FIELD_DUPLICATE');
					}
				}
				break;
		}
		
		$this->parse_calendar($field['field_type'], $v['value']);
		
		$insert = array(
			'assoc' => $v['uid'],
			'field' => $v['field_id'],
			'value' => $v['value']
		);
		$sql = 'INSERT INTO _members_store' . _build_array('INSERT', prefix('a', $insert));
		$v['nextid'] = _sql_nextid($sql);
		
		return $this->e('~OK');
	}
	
	protected function _value_create_query()
	{
		gfatal();
		
		$v = $this->__(array('f' => 0));
		
		$sql = 'SELECT *
			FROM _members_fields
			WHERE field_id = ?';
		if (!$field = _fieldrow(sql_filter($sql, $v['f'])))
		{
			_fatal();
		}
		
		switch ($field['field_type'])
		{
			case 'input':
			case 'checkbox':
			case 'textarea':
				break;
			case 'select':
				if (!f($field['field_relation']))
				{
					_fatal();
				}
				
				$e_select = explode('.', $field['field_relation']);
				
				$sql = 'SELECT ??, ??
					FROM _??
					ORDER BY ??';
				$table_relation = _rowset(sql_filter($sql, $e_select[1], $e_select[2], $e_select[0], $e_select[2]));
				
				foreach ($table_relation as $i => $row)
				{
					if (!$i) _style('select');
					
					_style('select.row', array(
						'V_VALUE' => $row[$e_select[1]],
						'V_NAME' => $row[$e_select[2]])
					);
				}
				break;
		}
		
		v_style(array(
			'IN' => $field['field_type'])
		);
		return $this->_template('computer.search.select');
	}
	
	protected function _value_call()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('a' => 0, 'field'));
		
		$field = w();
		$field_store = true;
		if (preg_match('#^\d+$#i', $v['field']))
		{
			$sql = 'SELECT *
				FROM _members_store
				WHERE a_id = ?
					AND a_assoc = ?';
			if (!$value = _fieldrow(sql_filter($sql, $v['field'], $v['a'])))
			{
				$this->_error('#COMPUTER_FIELD_NODATA');
			}
			
			$sql = 'SELECT *
				FROM _members_fields
				WHERE field_id = ?';
			if (!$field = _fieldrow(sql_filter($sql, $value['a_field'])))
			{
				$this->_error('#COMPUTER_FIELD_NOEXISTS');
			}
		}
		else
		{
			$sql = 'SELECT *
				FROM _members
				WHERE user_id = ?';
			if (!$value = _fieldrow(sql_filter($sql, $v['a'])))
			{
				$this->_error('#COMPUTER_FIELD_NODATA');
			}
			
			if ($v['field'] == 'nameshow')
			{
				$v['field'] = 'name_show';
			}
			
			if (!isset($value['user_' . $v['field']]))
			{
				$this->_error('#COMPUTER_FIELD_NODATA');
			}
			$field_store = false;
			
			$field_lang = array(
				'name_show' => 'CONTACT_FIELDS_NAME_SHOW',
				'firstname' => 'CONTACT_FIELDS_FIRSTNANE',
				'lastname' => 'CONTACT_FIELDS_LASTNAME',
				'username' => 'CONTACT_FIELDS_USERNAME'
			);
			$field = array(
				'field_type' => 'text',
				'field_id' => $v['field'],
				'field_alias' => $v['field'],
				'field_display' => _lang($field_lang[$v['field']]),
				'field_value' => $value['user_' . $v['field']]
			);
			$value['a_value'] = $value['user_' . $v['field']];
		}
		
		$checked = '';
		switch ($field['field_type'])
		{
			case 'select':
				$e = explode('.', $field['field_relation']);
				
				$sql = 'SELECT ??, ??
					FROM _??
					ORDER BY ??';
				$table_relation = _rowset(sql_filter($sql, $e[1], $e[2], $e[0], $e[2]));
				
				foreach ($table_relation as $i => $row)
				{
					if (!$i) _style('select');
					
					_style('select.item', array(
						'OPTION_ID' => $row[$e[1]],
						'OPTION_NAME' => $row[$e[2]],
						'SELECTED' => _selected($value['a_value'], $row[$e[1]]))
					);
				}
				break;
			case 'checkbox':
				if ($value['a_value'])
				{
					$checked = ' checked="checked"';
				}
				break;
			case 'calendar':
				$this->to_calendar($field['field_type'], $value['a_value']);
				break;
			case 'text':
			default:
				break;
		}
		
		v_style(array(
			'FIELD' => $v['a'] . '_' . $field['field_id'],
			'TYPE' => $field['field_type'],
			'NAME' => $field['field_alias'],
			'DISPLAY' => $field['field_display'],
			'VALUE' => $value['a_value'],
			'COMPUTER' => $v['a'],
			'CHECKED' => $checked)
		);
		
		return $this->_template('computer.search.field.value');
	}
	
	protected function _value_modify()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('field', 'uid' => 0));
		
		$ev = explode('_', $v['field']);
		$v['a'] = $ev[0];
		
		unset($ev[0]);
		$v['field'] = implode('_', $ev);
		
		$field = w();
		$field_store = true;
		if (is_numb($v['field']))
		{
			$sql = 'SELECT *
				FROM _members_store
				WHERE a_field = ?
					AND a_assoc = ?';
			if (!$value = _fieldrow(sql_filter($sql, $v['field'], $v['a'])))
			{
				$this->_error('#COMPUTER_FIELD_NODATA');
			}
			
			$sql = 'SELECT *
				FROM _members_fields
				WHERE field_id = ?';
			if (!$field = _fieldrow(sql_filter($sql, $value['a_field'])))
			{
				$this->_error('#COMPUTER_FIELD_NOEXISTS');
			}
		}
		else
		{
			$sql = 'SELECT *
				FROM _members
				WHERE user_id = ?';
			if (!$value = _fieldrow(sql_filter($sql, $v['a'])))
			{
				$this->_error('#COMPUTER_FIELD_NODATA');
			}
			
			if (!isset($value['user_' . $v['field']]))
			{
				$this->_error('#COMPUTER_FIELD_NOEXISTS');
			}
			$field_store = false;
			
			$field_lang = array(
				'name_show' => 'CONTACT_FIELDS_NAME_SHOW',
				'firstname' => 'CONTACT_FIELDS_FIRSTNANE',
				'lastname' => 'CONTACT_FIELDS_LASTNAME',
				'username' => 'CONTACT_FIELDS_USERNAME'
			);
			$field = array(
				'field_type' => 'text',
				'field_id' => $v['field'],
				'field_alias' => $v['field'],
				'field_display' => _lang($field_lang[$v['field']]),
				'field_value' => $value['user_' . $v['field']]
			);
			$value['a_value'] = $value['user_' . $v['field']];
		}
		
		$v = array_merge($v, $this->__(array($field['field_alias'])));
		$v['value'] = $v[$field['field_alias']];
		
		if ($field_store)
		{
			switch ($field['field_alias'])
			{
				case 'status':
					$sql = 'SELECT status_ext
						FROM _members_status
						WHERE status_id = ?';
					$status_ext = _field(sql_filter($sql, $v['value']), 'status_ext', 0);
					
					$sql = 'UPDATE _members SET user_active = ?
						WHERE user_id = ?';
					_sql(sql_filter($sql, $status_ext, $v['uid']));
					break;
				case 'carnet':
					if (!$field_ctype = $core->cache_load('members_field_ctype'))
					{
						$sql = 'SELECT field_id
							FROM _members_fields
							WHERE field_alias = ?';
						$field_ctype = $core->cache_store(_field(sql_filter($sql, 'ctype'), 'field_id'));
					}
					
					$sql = 'SELECT a_value
						FROM _members_store
						WHERE a_assoc = ?
							AND a_field = ?';
					if (!$uid_ctype = _field(sql_filter($sql, $v['uid'], $field_ctype), 'a_value'))
					{
						$this->_error('#FIELD_FIRST_CTYPE');
					}
					
					$sql = 'SELECT a_assoc
						FROM _members_store
						WHERE a_field = ?
							AND a_value = ?
							AND a_assoc <> ?';
					if ($a_assoc = _field(sql_filter($sql, $v['field'], $v['value'], $v['uid']), 'a_assoc'))
					{
						$sql = 'SELECT a_id
							FROM _members_store
							WHERE a_assoc = ?
								AND a_field = ?
								AND a_value = ?';
						if ($field_ctype = _field(sql_filter($sql, $a_assoc, $field_ctype, $uid_ctype), 'a_id'))
						{
							$this->_error('#FIELD_DUPLICATE');
						}
					}
					break;
			}
			
			$this->parse_calendar($field['field_type'], $v['value']);
			
			$sql = 'UPDATE _members_store SET a_value = ?
				WHERE a_id = ?';
			_sql(sql_filter($sql, $v['value'], $value['a_id']));
		}
		else
		{
			if ($field['field_alias'] == 'username' && ($v['value'] != $value['user_username']))
			{
				$sql = 'SELECT *
					FROM _members
					WHERE user_username = ?';
				if (_fieldrow(sql_filter($sql, $v['value'])))
				{
					$this->_error('#CONTACT_CREATE_EXISTS');
				}
			}
			
			$sql = 'UPDATE _members SET user_?? = ?
				WHERE user_id = ?';
			_sql(sql_filter($sql, $field['field_alias'], $v['value'], $value['user_id']));
		}
		
		return $this->e('~OK');
	}
	
	protected function _value_remove()
	{
		gfatal();
		
		global $user;
		
		$v = $this->__(array('eid' => 0, 'el' => 0));
		
		$sql = 'SELECT field_alias, a_assoc
			FROM _members_store
			INNER JOIN _members_fields ON field_id = a_field
			WHERE a_assoc = ? AND a_id = ?';
		if (!$store = _fieldrow(sql_filter($sql, $v['eid'], $v['el'])))
		{
			$this->_error('#TICKET_NOT_MEMBER');
		}
		
		switch ($store['field_alias'])
		{
			case 'status':
				$sql = 'SELECT field_alias, a_assoc, status_ext
					FROM _members_store
					INNER JOIN _members_fields ON field_id = a_field
					INNER JOIN _members_status ON status_id = a_value
					WHERE a_assoc = ? AND a_id = ?';
				if (!$sv = _fieldrow(sql_filter($sql, $v['eid'], $v['el'])))
				{
					$this->_error('#TICKET_NOT_MEMBER');
				}
				
				$sql = 'UPDATE _members SET user_active = ?
					WHERE user_id = ?';
				_sql(sql_filter($sql, (int) !$sv['status_ext'], $store['a_assoc']));
				break;
		}
		
		$sql = 'DELETE FROM _members_store
			WHERE a_id = ?';
		_sql(sql_filter($sql, $v['el']));
		
		return $this->e('~OK');
	}
	
	public function search()
	{
		$this->nav();
		$this->method();
	}
	
	protected function _search_home()
	{
		global $user;
		
		$v = $this->__(array('m', 'q', 'g' => 0, 'start' => 0));
		$v_results = 0;
		
		if (f($v['m']) || $v['g'])
		{
			if ($v['g'])
			{
				$sql = 'SELECT m.*
					FROM _members m
					LEFT JOIN _members_dept g ON g.this_id = m.user_dept
					WHERE m.user_dept = ?';
				$sql = sql_filter($sql, $v['g']);
			}
			else
			{
				$sql = 'SELECT *
					FROM _members
					WHERE user_username = ?';
				$sql = sql_filter($sql, $v['m']);
			}
			redirect(_link($this->m(), array('x1' => 'search', 'q' => array_key(sql_cache($sql), 'sid'))));
		}
		
		$button = _button();
		if ($button || f($v['q']))
		{
			if (!f($v['q']))
			{
				$build_search = $this->advanced_search($this->m());
				
				$build = 'SELECT mb.user_id, mb.user_active, mb.user_firstname, mb.user_lastname
					FROM ' . _implode(', ', $build_search['from']) . '
					WHERE ' . _implode(' ', $build_search['where']) . '
					GROUP BY mb.user_id
					ORDER BY mb.user_firstname, mb.user_lastname';
				redirect(_link($this->m(), array('x1' => 'search', 'q' => array_key(sql_cache($build), 'sid'))));
			}
			
			$button = true;
			$v_sql = array('limit_start' => $v['start'], 'limit_end' => 20);
			$cached = sql_cache('', $v['q']);
			
			if (strstr($cached['query'], 'SELECT a_assoc') !== false)
			{
				$cached['query'] = 'SELECT mb.user_id, mb.user_active, mb.user_firstname, mb.user_lastname
					FROM _members
					WHERE user_id IN (' . _implode(',', _rowset($cached['query'], false, 'user_id')) . ')
					ORDER BY user_firstname, user_lastname';
			}
			
			$build = _template_query($cached['query'], $v_sql);
			$build_limit = _template_query($cached['query'] . ' LIMIT {v_limit_start}, {v_limit_end}', $v_sql);
			
			if ($results = _rowset($build_limit, 'user_id', false, false, true))
			{
				$tabs = $this->init_tabs();
				$v_results = array_key(_fieldrow($build), '_numrows');
				
				_style('search', _vs(_pagination(_link($this->m(), array('x1' => 'search', 'q' => $v['q'])), 'start:%d', $v_results, 20, $v['start'])));
				
				$user->auth_replace('contacts_tab_general', 'contacts_search');
				
				foreach ($results as $row)
				{
					_style('search.row', _vs(array(
						'ID' => $row['user_id'],
						'TITLE' => _fullname($row),
						'STATUS' => ($row['user_active']) ? 'closed' : 'open'), 'V')
					);
					
					foreach ($tabs as $k => $k2)
					{
						// TODO: User pending tabs
						switch ($k)
						{
							case 'components':
							case 'attributes':
							case 'report':
							case 'vacation':
								continue 2;
								break;
						}
						
						if (!_auth_get('contacts_tab_' . $k)) continue;
						
						_style('search.row.tab', _vs(array(
							'TAG' => $k,
							'TITLE' => $k2['tab_name']), 'V')
						);
					}
				}
			}
		}
		
		$this->advanced_search_form($this->m());
		
		return v_style(array(
			'IS_SUBMIT' => $button,
			'RESULTS_PAGE' => $v_results,
			'U_SEARCH_TAB' => _link($this->m(), array('x1' => 'tab', 'uid' => '*', 'tag' => '?')))
		);
	}
	
	protected function _search_table()
	{
		gfatal();
		
		$v = $this->__(array('table' => 0));
		
		$sql = 'SELECT *
			FROM _search_tables
			INNER JOIN _search_categories ON table_cat = category_id
			WHERE category_alias = ?
				AND table_id = ?';
		if (!_fieldrow(sql_filter($sql, $this->m(), $v['table'])))
		{
			$this->_error('#E_COMPUTER_NO_FIELD');
		}
		
		$sql = 'SELECT *
			FROM _search_relation
			WHERE relation_table = ?';
		$relation = _rowset(sql_filter($sql, $v['table']));
		
		$response = w();
		foreach ($relation as $i => $row)
		{
			$response[$i] = array(
				'r_id' => $row['relation_id'],
				'r_name' => $row['relation_name']
			);
		}
		return $this->e(json_encode($response));
	}
	
	protected function _search_field()
	{
		gfatal();
		
		$v = $this->__(array('field' => 0));
		
		$sql = 'SELECT *
			FROM _search_relation
			WHERE relation_id = ?';
		if (!$field = _fieldrow(sql_filter($sql, $v['field'])))
		{
			$this->_error('#E_COMPUTER_NO_FIELD', false);
		}
		
		$special_select = array('_computer_fields cf', '_members_store ms');
		$e_tables = explode(',', trim($field['relation_tables']));
		foreach ($e_tables as $e_row)
		{
			if (in_array(trim($e_row), $special_select))
			{
				if (preg_match('#.*?field_alias \= \'(.*?)\'.*?#is', $field['relation_fields'], $e_cf))
				{
					$ee_row = explode('_', $e_row);
					
					$sql = 'SELECT *
						FROM _??_fields
						WHERE field_alias = ?';
					if ($row_cf = _fieldrow(sql_filter($sql, $ee_row[1], $e_cf[1])))
					{
						if ($field['relation_input'] != 'calendar') {
							$field['relation_input'] = $row_cf['field_type'];
						}
						$field['relation_select'] = $row_cf['field_relation'];
					}
				}
			}
		}
		
		switch ($field['relation_input'])
		{
			case 'input':
			case 'checkbox':
			case 'textarea':
				break;
			case 'select':
				if (!f($field['relation_select']))
				{
					_fatal();
				}
				
				$e_select = explode('.', $field['relation_select']);
				
				$sql = 'SELECT ??, ??
					FROM _??
					ORDER BY ??';
				$table_relation = _rowset(sql_filter($sql, $e_select[1], $e_select[2], $e_select[0], $e_select[2]));
				
				foreach ($table_relation as $i => $row)
				{
					if (!$i) _style('select');
					
					_style('select.row', array(
						'V_VALUE' => $row[$e_select[1]],
						'V_NAME' => $row[$e_select[2]])
					);
				}
				break;
		}
		
		v_style(array(
			'IN' => $field['relation_input'])
		);
		
		return $this->_template('computer.search.select');
	}
	
	public function tab()
	{
		$this->method();
	}
	
	protected function _tab_home()
	{
		if (!is_ghost())
		{
			redirect(_link($this->m()));
		}
		
		global $user;
		
		$v = $this->__(array('uid' => 0, 'tag'));
		
		if (!$v['uid'] || !f($v['tag']))
		{
			$this->_error('#FATAL_ERROR');
		}
		
		$tabs = $this->init_tabs();
		if (!isset($tabs[$v['tag']]))
		{
			$this->_error('#FATAL_ERROR');
		}
		
		$tab_auth = ($tabs[$v['tag']]['tab_function'] == 'general') ? 'search' : 'tab_' . $tabs[$v['tag']]['tab_function'];
		if (!_auth_get('contacts_' . $tab_auth))
		{
			_fatal();
		}
		
		$sql = 'SELECT *
			FROM _members
			WHERE user_id = ?';
		if (!$uid = _fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('#TICKET_NOT_MEMBER');
		}
		
		$f = '_tab_function_' . $tabs[$v['tag']]['tab_function'];
		if (!method_exists($this, $f))
		{
			$this->_error('#FATAL_ERROR');
		}
		
		$this->$f($v, $uid);
		$this->e('!');
		
		v_style(array(
			'TAG' => $v['tag'],
			'V_UID' => $v['uid'])
		);
		
		return $this->_template('contacts.search.ajax');
	}
	
	private function _tab_function_general($v, $uid)
	{
		global $user;
		
		$sql = 'SELECT *
			FROM _members_store
			INNER JOIN _members_fields ON field_id = a_field
			WHERE field_show = ?
				AND a_assoc = ?
			ORDER BY field_display';
		$fields = _rowset(sql_filter($sql, 1, $v['uid']));
		
		$fields2 = array(
			array(
				'field_alias' => 'nameshow',
				'field_display' => 'Nombre a mostrar',
				'field_type' => 'text',
				'field_relation' => '',
				'field_js' => '',
				'a_id' => 'nameshow',
				'a_value' => $uid['user_name_show'],
				'can_delete' => false
			),
			array(
				'field_alias' => 'firstname',
				'field_display' => 'Nombre',
				'field_type' => 'text',
				'field_relation' => '',
				'field_js' => '',
				'a_id' => 'firstname',
				'a_value' => $uid['user_firstname'],
				'can_delete' => false
			),
			array(
				'field_alias' => 'lastname',
				'field_display' => 'Apellido',
				'field_type' => 'text',
				'field_relation' => '',
				'field_js' => '',
				'a_id' => 'lastname',
				'a_value' => $uid['user_lastname'],
				'can_delete' => false
			),
			array(
				'field_alias' => 'username',
				'field_display' => 'Nombre de usuario',
				'field_type' => 'text',
				'field_relation' => '',
				'field_js' => '',
				'a_id' => 'username',
				'a_value' => $uid['user_username'],
				'can_delete' => false
			)
		);
		$rows = array_merge($fields2, $fields);
		
		foreach ($rows as $row)
		{
			$this->_relation_value($row);
			
			$f_name = 'tabs_callback_' . $row['field_alias'];
			if (@method_exists($this, $f_name))
			{
				$this->{$f_name}($row, 'field_alias', 'a_value');
			}
			
			$this->to_calendar($row['field_type'], $row['a_value']);
			
			_style('field', array(
				'ROW' => $row['a_id'],
				'ALIAS' => $row['field_alias'],
				'NAME' => $row['field_alias'],
				'DISPLAY' => $row['field_display'],
				'VALUE' => $row['a_value'],
				'TYPE' => $row['field_type'],
				'JS' => $row['field_js'],
				'CAN_DELETE' => (isset($row['can_delete']) ? $row['can_delete'] : true),
				'CAN_MODIFY' => (isset($row['can_modify']) ? $row['can_modify'] : true))
			);
		}
		
		foreach (w('text textarea checkbox select calendar') as $alias)
		{
			_style('field_type', array(
				'NAME' => _lang('FIELD_TYPE_' . $alias),
				'VALUE' => $alias)
			);
		}
		
		//
		// All fields
		$sql = 'SELECT *
			FROM _members_fields
			WHERE field_show = 1
			ORDER BY field_display';
		$members_fields = _rowset($sql);
		
		foreach ($members_fields as $row)
		{
			_style('field_available', array(
				'OPTION_ID' => $row['field_id'],
				'OPTION_NAME' => $row['field_display'])
			);
		}
		
		return v_style(array(
			'V_CONTACT' => $v['uid'])
		);
	}
	
	private function _tab_function_computer($v, $uid)
	{
		global $user;
		
		$sql = 'SELECT c.a_assoc, c.a_value, mb.user_firstname, mb.user_lastname
			FROM _computer c, _computer_users cu, _members mb 
			WHERE c.a_assoc = cu.computer_id
				AND cu.computer_uid = mb.user_id 
				AND mb.user_id = ?
			GROUP BY c.a_assoc
			ORDER BY mb.user_firstname, mb.user_lastname';
		
		return v_style(array(
			'V_URL' => _link('computer', array('x1' => 'search', 'q' => array_key(sql_cache(sql_filter($sql, $v['uid'])), 'sid'))))
		);
	}
	
	private function _tab_function_auth($v, $uid)
	{
		global $user;
		
		v_style(array(
			'U_DO_FOUNDER' => _link($this->m(), array('x1' => 'authorize', 'x2' => 'founder', 'uid' => $v['uid'])),
			'DO_FOUNDER_CLASS' => ($uid['user_type'] == U_FOUNDER) ? 'closed' : 'open'
		));
		
		if ($uid['user_type'] == U_FOUNDER)
		{
			return;
		}
		
		$sql = 'SELECT *
			FROM _members_auth_fields
			ORDER BY field_name';
		$fields = _rowset($sql);
		
		$sql = 'SELECT *
			FROM _members_auth
			WHERE auth_uid = ?';
		$auth = _rowset(sql_filter($sql, $v['uid']), 'auth_field');
		
		foreach ($fields as $i => $row)
		{
			if (!$i) _style('auth');
			
			$value = 0;
			if (isset($auth[$row['field_id']]))
			{
				$value = 1;
			}
			
			_style('auth.row', array(
				'FIELD' => $row['field_id'],
				'NAME' => implode(' ', explode('_', $row['field_name'])),
				'CLASS' => ($value) ? 'closed' : 'open')
			);
		}
		
		return true;
	}
	
	private function _tab_function_components($v, $uid)
	{
		$this->_error('#NOT_IMPLEMENTED');
	}
	
	private function _tab_function_attributes($v, $uid)
	{
		$this->_error('#NOT_IMPLEMENTED');
	}
	
	private function _tab_function_report($v, $uid)
	{
		$this->_error('#NOT_IMPLEMENTED');
	}
	
	private function _tab_function_groups($v, $uid)
	{
		global $user;
		
		$sql = 'SELECT *
			FROM _groups
			INNER JOIN _groups_members gm ON group_id = member_group
				AND member_uid = ?';
		$result = _rowset(sql_filter($sql, $v['uid']));
		
		foreach ($result as $row)
		{
			_style('group', array(
				'ID' => $row['group_id'],
				'NAME' => $row['group_name'],
				'ALIAS' => $row['group_email'])
			);
		}
		
		$sql = 'SELECT *
			FROM _groups
			WHERE group_id NOT IN (
				SELECT member_group
				FROM _groups_members
				WHERE member_uid = ?
			)
			ORDER BY group_name';
		$groups = _rowset(sql_filter($sql, $v['uid']));
		
		foreach ($groups as $i => $row)
		{
			if (!$i) _style('groups');
			
			_style('groups.row', array(
				'VALUE' => $row['group_id'],
				'NAME' => $row['group_name'])
			);
		}
		
		return;
	}
	
	public function authorize()
	{
		$this->method();
	}
	
	protected function _authorize_field()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('alias', 'name', 'global' => 0));
		
		foreach ($v as $k1 => $v1)
		{
			if ($v1 === '')
			{
				$this->_error('#FIELD_IS_EMPTY');
			}
		}
		
		$sql = 'INSERT INTO _members_auth_fields' . _build_array('INSERT', prefix('field', $v));
		_sql($sql);
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	protected function _authorize_value()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('uid' => 0, 'f' => 0));
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE user_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('#TICKET_NOT_MEMBER');
		}
		
		$sql = 'SELECT field_id
			FROM _members_auth_fields
			WHERE field_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['f'])))
		{
			$this->_error('#FIELD_NO_EXISTS');
		}
		
		if (!$user->v('is_founder') && !_auth_get('contacts_auth_update') && $user->v('user_id') != $v['uid'])
		{
			$this->_error('#NOT_AUTH');
		}
		
		$sql = 'SELECT *
			FROM _members_auth
			WHERE auth_uid = ?
				AND auth_field = ?';
		if (!_fieldrow(sql_filter($sql, $v['uid'], $v['f'])))
		{
			$sql_insert = array(
				'uid' => $v['uid'],
				'field' => $v['f'],
				'value' => 1
			);
			$sql = 'INSERT INTO _members_auth' . _build_array('INSERT', prefix('auth', $sql_insert));
		}
		else
		{
			$sql = 'DELETE FROM _members_auth
				WHERE auth_uid = ?
					AND auth_field = ?';
			$sql = sql_filter($sql, $v['uid'], $v['f']);
		}
		_sql($sql);
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	protected function _authorize_founder()
	{
		gfatal();
		
		global $user;
		
		if (!$user->v('is_founder'))
		{
			$this->_error('#NOT_AUTH');
		}
		
		$v = $this->__(array('uid' => 0));
		
		if ($user->v('is_founder') && $v['uid'] == $user->v('user_id'))
		{
			$this->_error('#NOT_AUTH');
		}
		
		$sql = 'SELECT user_type
			FROM _members
			WHERE user_id = ?';
		$set = _field(sql_filter($sql, $v['uid']), 'user_type');
		
		$response = w();
		if ($set == U_FOUNDER)
		{
			$sql = 'UPDATE _members SET user_type = 0
				WHERE user_id = ?';
			_sql(sql_filter($sql, $v['uid']));
			
			$response['class'] = 'open';
		}
		else
		{
			$sql = 'UPDATE _members SET user_type = ?
				WHERE user_id = ?';
			_sql(sql_filter($sql, U_FOUNDER, $v['uid']));
			
			$response['class'] = 'closed';
		}
		
		return $this->e(json_encode($response));
	}
	
	protected function _authorize_check()
	{
		global $core;
		
		$sql = 'SELECT field_id, field_alias
			FROM _members_auth_fields
			WHERE field_global = 0
			ORDER BY field_alias';
		$fields = _rowset($sql);
		
		$list = w();
		foreach ($fields as $row)
		{
			$sql = 'SELECT COUNT(auth_id) AS total
				FROM _members_auth
				WHERE auth_field = ?';
			if (!_field(sql_filter($sql, $row['field_id']), 'total', 0))
			{
				$list[$row['field_id']] = $row['field_alias'];
				
				$sql = 'DELETE FROM _members_auth_fields
					WHERE field_id = ?';
				_sql(sql_filter($sql, $row['field_id']));
			}
		}
		
		$core->cache_unload();
		
		_pre($list, true);
		
		return;
	}
	
	public function group()
	{
		$this->method();
	}
	
	protected function _group_create()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('group' => 0, 'uid' => 0));
		
		$sql = 'SELECT *
			FROM _groups
			WHERE group_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['group'])))
		{
			$this->_error('#GROUPS_NO_EXISTS');
		}
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE user_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('#E_COMPUTER_NO_USER');
		}
		
		$sql = 'SELECT member_id
			FROM _groups_members
			WHERE member_group = ?
				AND member_uid= ?';
		if (_field(sql_filter($sql, $v['group'], $v['uid']), 'member_id', 0))
		{
			$this->_error('#GROUP_USER_ASSIGNED');
		}
		
		$sql_insert = array(
			'group' => $v['group'],
			'uid' => $v['uid']
		);
		$sql = 'INSERT INTO _groups_members' . _build_array('INSERT', prefix('member', $sql_insert));
		_sql($sql);
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	protected function _group_remove()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('el' => 0, 'eid' => 0));
		
		$sql = 'SELECT group_id
			FROM _groups
			WHERE group_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#GROUPS_NO_EXISTS');
		}
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE
			user_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['eid'])))
		{
			$this->_error('#E_COMPUTER_NO_USER');
		}
		
		$sql = 'SELECT member_id
			FROM _groups_members
			WHERE member_group = ?
				AND member_uid = ?';
		if (!$assign = _fieldrow(sql_filter($sql, $v['el'], $v['eid'])))
		{
			$this->_error('#GROUP_USER_NO_ASSIGNED');
		}
		
		$sql = 'DELETE FROM _groups_members
			WHERE member_id = ?';
		_sql(sql_filter($sql, $assign['member_id']));
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	public function edit()
	{
		$this->method();
	}
	
	protected function _edit_home()
	{
		_fatal();
	}
	
	public function delete()
	{
		$this->method();
	}
	
	protected function _delete_home()
	{
		_fatal();
	}
	
	public function remove()
	{
		$this->method();
	}
	
	protected function _remove_home()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('uid' => 0));
		if (!$v['uid'])
		{
			$this->_error('#FATAL_ERROR');
		}
		
		$sql = 'SELECT *
			FROM _members
			WHERE user_id = ?';
		if (!$prof = _fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('#TICKET_NOT_MEMBER');
		}
		
		$sql = 'SELECT *
			FROM _computer_users
			WHERE computer_uid = ?';
		if (_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('REMOVE_ERROR');
		}
		
		$sql = 'SELECT *
			FROM _group_members
			WHERE member_uid = ?';
		if (_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('REMOVE_ERROR');
		}
		
		$sql = 'SELECT *
			FROM _tickets
			WHERE ticket_contact = ?';
		if (_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('REMOVE_ERROR');
		}
		
		$sql = 'SELECT *
			FROM _tickets_assign
			WHERE user_id = ?';
		if (_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('REMOVE_ERROR');
		}
		
		$sql = 'SELECT *
			FROM _tickets_notes
			WHERE user_id = ?';
		if (_fieldrow(sql_filter($sql, $v['uid'])))
		{
			$this->_error('REMOVE_ERROR');
		}
		
		//
		$sql = 'DELETE FROM _members_auth
			WHERE auth_uid = ?';
		_sql(sql_filter($sql, $v['uid']));
		
		$sql = 'DELETE FROM _members_store
			WHERE a_assoc = ?';
		_sql(sql_filter($sql, $v['uid']));
		
		$sql = 'DELETE FROM _sessions
			WHERE session_user_id = ?';
		_sql(sql_filter($sql, $v['uid']));
		
		$sql = 'DELETE FROM _chat_sessions
			WHERE session_orig = ?
				OR session_dest = ?';
		_sql(sql_filter($sql, $v['uid'], $v['uid']));
		
		$sql = 'DELETE FROM _chat_messages
			WHERE msg_userid = ?';
		_sql(sql_filter($sql, $v['uid']));
		
		$sql = 'DELETE FROM _search_cache
			WHERE cache_uid = ?';
		_sql(sql_filter($sql, $v['uid']));
		
		$core->cache_unload();
		
		$this->_error('REMOVE_SUCCESS');
		
		return;
	}
	
	public function groups()
	{
		$this->method();
	}
	
	protected function _groups_home()
	{
		$sql = 'SELECT group_id, group_name, group_email
			FROM _groups g
			ORDER BY group_name';
		$groups = _rowset($sql);
		
		foreach ($groups as $i => $row)
		{
			if (!$i) _style('groups');
			
			_style('groups.row', array(
				'ID' => $row['group_id'],
				'NAME' => $row['group_name'],
				'EMAIL' => $row['group_email'])
			);
		}
		
		return;
	}
	
	protected function _groups_create()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('g_name', 'g_email', 'g_mod', 'g_color'));
		
		if (!f($v['g_name']) || !f($v['g_email']) || !f($v['g_mod']))
		{
			$this->_error('#FIELD_IS_EMPTY');
		}
		
		$sql = 'SELECT group_id
			FROM _groups
			WHERE group_name = ?';
		if (_fieldrow(sql_filter($sql, $v['g_name'])))
		{
			$this->_error('#GROUP_NAME_EXISTS');
		}
		
		$sql = 'SELECT group_id
			FROM _groups
			WHERE group_email = ?';
		if (_fieldrow(sql_filter($sql, $v['g_email'])))
		{
			$this->_error('#GROUP_EMAIL_EXISTS');
		}
		
		$mod_list = array_map('trim', explode(',', $v['g_mod']));
		array_unshift($mod_list, 'addquotes');
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE user_username IN (??)
			ORDER BY user_username';
		if (!$mods_list = _rowset(sql_filter($sql, _implode(',', $mod_list)), false, 'user_id'))
		{
			$this->_error('#USER_UNKNOWN');
		}
		
		$sql_insert = array(
			'name' => $v['g_name'],
			'email' => $v['g_email'],
			'color' => $v['g_color']
		);
		$sql = 'INSERT INTO _groups' . _build_array('INSERT', prefix('group', $sql_insert));
		$group_id = _sql_nextid($sql);
		
		foreach ($mods_list as $row)
		{
			$sql_insert = array(
				'group' => $group_id,
				'uid' => $row,
				'mod' => 1
			);
			$sql = 'INSERT INTO _groups_members' . _build_array('INSERT', prefix('member', $sql_insert));
			_sql($sql);
		}
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	protected function _groups_call()
	{
		gfatal();
		
		$v = $this->__(array('el' => 0));
		
		$sql = 'SELECT group_id, group_name, group_email, group_color
			FROM _groups
			WHERE group_id = ?';
		if (!$group = _fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#GROUPS_NO_EXISTS');
		}
		
		$sql = 'SELECT m.user_username
			FROM _groups_members gm, _members m
			WHERE gm.member_group = ?
				AND gm.member_uid = m.user_id
			ORDER BY m.user_username';
		$mods = _rowset(sql_filter($sql, $v['el']), false, 'user_username');
		
		$response = array(
			'id' => $group['group_id'],
			'name' => $group['group_name'],
			'email' => $group['group_email'],
			'mod' => implode(', ', $mods),
			'color' => $group['group_color']
		);
		return $this->e(json_encode($response));
	}
	
	protected function _groups_modify()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('el' => 0, 'r_name', 'r_email', 'r_mod', 'r_color'));
		
		foreach ($v as $row)
		{
			if (!f($row))
			{
				$this->_error('#FIELD_IS_EMPTY');
			}
		}
		
		$sql = 'SELECT *
			FROM _groups
			WHERE group_id = ?';
		if (!$group = _fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#GROUPS_NO_EXISTS');
		}
		
		$mod_list = array_map('trim', explode(',', $v['r_mod']));
		array_unshift($mod_list, 'addquotes');
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE user_username IN (??)
			ORDER BY user_username';
		if (!$mods_list = _rowset(sql_filter($sql, _implode(',', $mod_list)), false, 'user_id'))
		{
			$this->_error('#USER_UNKNOWN');
		}
		
		$sql = 'UPDATE _groups SET group_name = ?, group_email = ?, group_color = ?
			WHERE group_id = ?';
		_sql(sql_filter($sql, $v['r_name'], $v['r_email'], $v['r_color'], $v['el']));
		
		$sql = 'UPDATE _groups_members SET member_mod = 0
			WHERE member_group = ?';
		_sql(sql_filter($sql, $v['el']));
		
		foreach ($mods_list as $row)
		{
			$sql = 'SELECT member_id
				FROM _groups_members
				WHERE member_uid = ?';
			if (_field(sql_filter($sql, $row), 'member_id', 0))
			{
				$sql = 'UPDATE _groups_members SET member_mod = ?
					WHERE member_uid = ?';
				_sql(sql_filter($sql, 1, $row));
			}
			else
			{
				$sql_insert = array(
					'group' => $group_id,
					'uid' => $row,
					'mod' => 1
				);
				$sql = 'INSERT INTO _groups_members' . _build_array('INSERT', prefix('member', $sql_insert));
				_sql($sql);
			}
		}
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	protected function _groups_remove()
	{
		gfatal();
		
		global $core;
		
		$v = $this->__(array('el' => 0));
		
		$sql = 'SELECT group_id
			FROM _groups
			WHERE group_id = ?';
		if (!$group = _fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#GROUPS_NO_EXISTS');
		}
		
		$sql = 'SELECT ticket_id
			FROM _tickets
			WHERE ticket_group = ?';
		if (_fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#GROUP_CANT_REMOVE_TICKETS');
		}
		
		$sql = 'DELETE FROM _groups
			WHERE group_id = ?';
		_sql(sql_filter($sql, $v['el']));
		
		$sql = 'DELETE FROM _groups_members
			WHERE member_group = ?';
		_sql(sql_filter($sql, $v['el']));
		
		$core->cache_unload();
		
		return $this->e('~OK');
	}
	
	//
	private function af_date($val)
	{
		return ($val) ? gmdate('d/m/Y h:i', $val) : $val;
	}
	
	private function field($f, $k, $value)
	{
		return $value;
	}
}

?>