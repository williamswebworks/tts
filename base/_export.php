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

class __export extends xmd
{
	public function __construct()
	{
		parent::__construct();
	}
	
	public function home()
	{
		global $user;
		
		$v = $this->__(array('username', 'start', 'end'));
		
		if (_button())
		{
			if (!f($v['username']))
			{
				$this->e('Debe ingresar un nombre de usuario.');
			}
			
			$sql = 'SELECT *
				FROM _members
				WHERE user_username = ?';
			if (!$userdata = _fieldrow(sql_filter($sql, $v['username'])))
			{
				$this->_error('#TICKET_NOT_MEMBER');
			}
			
			$sql = "SELECT assign_ticket
				FROM _tickets_assign a, _members m
				WHERE m.user_username = ?
					AND m.user_id = a.user_id
				ORDER BY assign_ticket";
			$as = _rowset(sql_filter($sql, $v['username']), false, 'assign_ticket');
			if (!count($as))
			{
				$this->e('No hay solicitudes asignadas al usuario.');
			}
			
			//
			$e_start = explode('-', $v['start']);
			$v_start = mktime(0, 0, 0, $e_start[1], $e_start[0], $e_start[2]);
			
			//
			$sql = 'SELECT *
				FROM _tickets_status
				ORDER BY status_alias';
			$status = _rowset($sql, 'status_id', 'status_name');
			
			$sql = 'SELECT *
				FROM _tickets_cat
				ORDER BY cat_id';
			$cat = _rowset($sql, 'cat_id', 'cat_name');
			
			//
			$sql = 'SELECT *
				FROM _tickets t, _members m
				WHERE t.ticket_contact = m.user_id
					AND t.ticket_id IN (' . implode(',', $as) . ')
					/*AND t.ticket_status = 3*/
					AND t.ticket_start > ??
					AND t.ticket_deleted = 0
				ORDER BY t.ticket_start';
			$tickets = _rowset(sql_filter($sql, $v_start));
			
			if (!count($tickets))
			{
				_style('no_tickets');
			}
			
			foreach ($tickets as $i => $row)
			{
				if (!$i) _style('tickets');
				
				$sql = 'SELECT *
					FROM _tickets_assign a, _members m
					WHERE a.user_id = m.user_id
						AND assign_ticket = ?
					ORDER BY user_firstname';
				$names = w();
				foreach (_rowset(sql_filter($sql, $row['ticket_id']), 'assign_id') as $assigned_row)
				{
					$names[] = _fullname($assigned_row);
				}
				
				_style('tickets.row', array(
					'SOLICITANTE' => _fullname($row),
					'ASIGNADOS' => implode(', ', $names),
					'CATEGORIA' => $cat[$row['ticket_cat']],
					'FECHAHORA' => _format_date($row['ticket_start']),
					'TITULO' => $row['ticket_title'],
					'TEXTO' => $row['ticket_text'],
					'ESTADO' => $status[$row['ticket_status']])
				);
				
				//
				$sql = 'SELECT *
					FROM _tickets_notes n, _members m
					WHERE n.ticket_id = ??
						AND n.user_id = m.user_id
					ORDER BY n.note_time DESC';
				$notes = _rowset(sql_filter($sql, $row['ticket_id']));
				
				foreach ($notes as $note_row)
				{
					_style('tickets.row.notes', array(
						'AUTOR' => _fullname($note_row),
						'TEXTO' => $note_row['note_text'],
						'FECHAHORA' => _format_date($note_row['note_time']))
					);
				}
			}
		}
		
		$now = getdate();
		
		v_style(array(
			'U_FILTER' => _link('export'),
			'V_USERNAME' => $v['username'],
			'V_NOW' => (f($v['start'])) ? $v['start'] : $now['mday'] . '-' . $now['mon'] . '-' . $now['year'])
		);
		
		return $this->_template('ticket_export');
	}
}

?>