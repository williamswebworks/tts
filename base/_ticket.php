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

class __ticket extends xmd
{
	public function __construct()
	{
		parent::__construct();
		
		$this->_m(array(
			'mini' => w(),
			'view' => w(),
			'create' => w(),
			'search' => w('table field status'),
			'note' => w('create modify remove'),
			'ticket' => w('modify remove status cat groups'),
			'tech' => w('query add remove'),
			'cat' => w('create call modify remove'))
		);
		
		$this->exclude = w('mini');
	}
	
	private function init_ticket($v)
	{
		$sql = 'SELECT *
			FROM _tickets
			WHERE ticket_id = ?';
		if (!$ticket = _fieldrow(sql_filter($sql, $v)))
		{
			_fatal();
		}
		return $ticket;
	}
	
	private function init_status_list($k = false, $v = false)
	{
		global $core;
		
		if (!$status = $core->cache_load('ticket_status_alias'))
		{
			$sql = 'SELECT *
				FROM _tickets_status
				ORDER BY status_id';
			$status = $core->cache_store(_rowset($sql, 'status_id'));
		}
		
		if ($k !== false && is_array($status))
		{
			$a_status = w();
			foreach ($status as $a)
			{
				$a_status[$a[$k]] = (($v !== false) ? $a[$v] : $a);
			}
			$status = $a_status;
		}
		
		return $status;
	}
	
	private function init_status($v)
	{
		global $core;
		
		if (!$status = $core->cache_load('ticket_status'))
		{
			$sql = 'SELECT *
				FROM _tickets_status
				ORDER BY status_id';
			$status = $core->cache_store(_rowset($sql, 'status_id'));
		}
		
		if (!isset($status[$v]))
		{
			return false;
		}
		return 'ticket_status_' . $status[$v]['status_alias'];
	}
	
	private function init_mode()
	{
		global $core;
		
		if (!$mode = $core->cache_load('ticket_mode'))
		{
			$sql = 'SELECT *
				FROM _tickets_mode
				ORDER BY mode_order';
			$mode = $core->cache_store(_rowset($sql, 'mode_alias'));
		}
		return $mode;
	}
	
	private function __home_common($offset, $mode = '')
	{
		global $user;
		
		$w = $this->__(array('e'));
		
		$i = 0;
		$mode = $this->init_mode();
		foreach ($mode as $k => $v)
		{
			if (!_auth_get('ticket_view_' . $k)) continue;
			
			if (!$i) _style('mode');
			
			$u = array('view' => $k, 'f' => '0');
			if ($offset)
			{
				$u['offset'] = $offset;
			}
			if ($w['e'] == 'table')
			{
				$u['e'] = $w['e'];
			}
			
			_style('mode.row', array(
				'URL' => _link($this->m(), $u),
				'NAME' => $v['mode_name'],
				'SELECTED' => _selected($mode, $k))
			);
			$i++;
		}
		
		$i = 0;
		$status = $this->init_status_list();
		
		return _rowset_foreach($status, 'status');
	}
	
	public function home()
	{
		global $user;
		
		$v = $this->__(array('ssid', 'code', 'view', 'e', 'f', 'a' => 0, 'offset' => 0));
		
		$total = 0;
		$per_page = 15;
		$sql = $sql_total = $sql_where = '';
		
		if ($v['view'] == 'search')
		{
			if (!f($v['ssid'])) _fatal();
			
			$cached = sql_cache('', $v['ssid']);
			$sql_total = $cached['query'];
			$sql = $sql_total . ' LIMIT {v_limit_start}, {v_limit_end}';
			
			$v['a_view'] = array(
				'mode_alias' => 'search',
				'mode_name' => 'Buscar',
				'mode_sql' => $sql,
				'mode_sql_total' => $sql_total
			);
		}
		else
		{
			$modes = $this->init_mode();
			
			$v['view'] = (isset($modes[$v['view']])) ? $v['view'] : 'all';
			$v['a_view'] = $modes[$v['view']];
			
			if ($v['a_view']['mode_alias'] == 'all' && $user->v('user_type') != U_FOUNDER)
			{
				$sql = 'SELECT *
					FROM _groups_members
					WHERE member_uid = ?';
				if (!$row = _fieldrow(sql_filter($sql, $user->v('user_id'))))
				{
					redirect(_link($this->m(), array('view' => 'own')));
				}
			}
		}
		
		$filter_uid = $user->v('user_id');
		if (f($v['f']))
		{
			$sql = 'SELECT user_id
				FROM _members
				WHERE user_username = ?';
			$filter_uid = _field(sql_filter($sql, $v['f']), 'user_id', $filter_uid);
		}
		
		$status_alias = $this->init_status_list('status_alias', 'status_id');
		
		if ($v['e'] == 'table')
		{
			$v['a_view']['mode_sql'] = str_replace('LIMIT {v_limit_start}, {v_limit_end}', '', $v['a_view']['mode_sql']);
		}
		
		$v_sql = array(
			'userid' => $filter_uid,
			'group' => $user->auth_groups(),
			'limit_start' => $v['offset'],
			'limit_end' => $per_page,
			'closed' => $status_alias['closed']
		);
		$tickets_sql = _template_query($v['a_view']['mode_sql'], $v_sql);
		$tickets_sql_total = _template_query($v['a_view']['mode_sql_total'], $v_sql);
		
		if (!f($tickets_sql) || !f($tickets_sql_total)) _fatal();
		
		if ($row = _fieldrow($tickets_sql_total))
		{
			$total = (isset($row['total'])) ? $row['total'] : _numrows($row);
		}
		
		if ($tickets = _rowset($tickets_sql))
		{
			$groups = $user->_groups();
			$status_list = $this->init_status_list();
			
			if ($v['e'] == 'table')
			{
				$sql_tickets = preg_replace('#^SELECT (.*?)[\n]#is', 'SELECT ticket_id' . "\n", $tickets_sql);
				
				//
				// Assignees
				$sql = 'SELECT a.assign_ticket, m.user_firstname, m.user_lastname
					FROM _tickets_assign a, _members m
					WHERE a.assign_ticket IN (' . $sql_tickets . ')
						AND a.user_id = m.user_id
					ORDER BY a.assign_ticket';
				$tech_assoc = _rowset($sql, 'assign_ticket', false, true);
				
				//_pre($tech_assoc, true);
				
				//
				// Notes
				$sql = 'SELECT m.user_id, m.user_firstname, m.user_lastname, n.ticket_id, n.note_text, n.note_time, n.note_cc
					FROM _members m, _tickets_notes n
					WHERE n.ticket_id IN (' . $sql_tickets . ')
						AND n.user_id = m.user_id
					ORDER BY n.ticket_id, n.note_time';
				$notes_assoc = _rowset($sql, 'ticket_id', false, true);
				
				@set_time_limit(0);
				
				//
				// Include the PHPExcel classes
				require_once(XFS . 'core/excel/PHPExcel.php');
				require_once(XFS . 'core/excel/PHPExcel/Writer/Excel5.php');
				
				require_once(XFS . 'core/css.php');
				$phpcss = new phpcss();
				$phpcss->parse('./style/css/default.css');
				
				// Start to build the spreadsheet
				$excel = new PHPExcel();
				$excel->setActiveSheetIndex(0);
				$excel->getActiveSheet()->getHeaderFooter()->setOddFooter("&RPage &P of &N");
				
				//
				$excel->getActiveSheet()->setCellValue('A1', 'Titulo');
				$excel->getActiveSheet()->setCellValue('B1', 'Asignado');
				$excel->getActiveSheet()->setCellValue('C1', 'Categoria');
				$excel->getActiveSheet()->setCellValue('D1', 'Solicitante');
				$excel->getActiveSheet()->setCellValue('E1', 'Fecha/hora');
				$excel->getActiveSheet()->setCellValue('F1', 'Texto');
				$excel->getActiveSheet()->setCellValue('G1', 'Estado');
				
				$excel->getActiveSheet()->getStyle("A1:G1")->getAlignment()->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_CENTER);
				$excel->getActiveSheet()->getStyle("A1:G1")->getFont()->setBold(true);
				$excel->getActiveSheet()->getStyle("A1:G1")->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID)->getStartColor()->setRGB('EBEBC6');
				
				$excel->getActiveSheet()->getColumnDimension('A')->setWidth(20);
				$excel->getActiveSheet()->getColumnDimension('B')->setWidth(15);
				$excel->getActiveSheet()->getColumnDimension('C')->setWidth(10);
				$excel->getActiveSheet()->getColumnDimension('D')->setWidth(15);
				$excel->getActiveSheet()->getColumnDimension('E')->setWidth(15);
				$excel->getActiveSheet()->getColumnDimension('F')->setWidth(30);
				$excel->getActiveSheet()->getColumnDimension('G')->setWidth(10);
				
				$i = 2;
				foreach ($tickets as $row)
				{
					$row_color = $phpcss->property_get('.ticket_status_' . $status_list[$row['ticket_status']]['status_alias'], 'background');
					$row_color = preg_replace('#^\#([A-Za-z0-9]+).*?$#is', '\1', $row_color);
					
					if (!isset($row['cat_name']))
					{
						$row['cat_name'] = '';
					}
					
					$assignees = '';
					if (isset($tech_assoc[$row['ticket_id']]))
					{
						foreach ($tech_assoc[$row['ticket_id']] as $rowtech)
						{
							$assignees .= (f($assignees) ? ', ' : '') . _fullname($rowtech);
						}
					}
					
					$excel->getActiveSheet()->setCellValue("A$i", entity_decode($row['ticket_title']));
					$excel->getActiveSheet()->setCellValue("B$i", entity_decode($assignees));
					$excel->getActiveSheet()->setCellValue("C$i", entity_decode($row['cat_name']));
					$excel->getActiveSheet()->setCellValue("D$i", entity_decode(_fullname($row)));
					$excel->getActiveSheet()->setCellValue("E$i", entity_decode(_format_date($row['ticket_start'])));
					$excel->getActiveSheet()->setCellValue("F$i", entity_decode($row['ticket_text']));
					$excel->getActiveSheet()->setCellValue("G$i", entity_decode($status_list[$row['ticket_status']]['status_name']));
					
					$excel->getActiveSheet()->getStyle("A$i:G$i")->getAlignment()->setWrapText(true)->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_LEFT);
					$excel->getActiveSheet()->getStyle("A$i:G$i")->getFill()->setFillType(PHPExcel_Style_Fill::FILL_SOLID)->getStartColor()->setRGB($row_color);
					
					$i++;
					
					if (isset($notes_assoc[$row['ticket_id']]))
					{
						foreach ($notes_assoc[$row['ticket_id']] as $rownote)
						{
							$excel->getActiveSheet()->setCellValue("B$i", entity_decode(_fullname($rownote)));
							$excel->getActiveSheet()->setCellValue("E$i", entity_decode(_format_date($rownote['note_time'])));
							$excel->getActiveSheet()->setCellValue("F$i", entity_decode($rownote['note_text']));
							
							$excel->getActiveSheet()->mergeCells("F$i:G$i");
							$excel->getActiveSheet()->getStyle("A$i:G$i")->getAlignment()->setWrapText(true)->setHorizontal(PHPExcel_Style_Alignment::HORIZONTAL_LEFT);
							
							$i++;
						}
					}
				}
				
				$excel->getActiveSheet()->freezePane('A2');
				
				//
				// Output the headers
				header('Content-Type: application/vnd.ms-excel;');
				header('Content-type: application/x-msexcel');
				header('Content-Disposition: attachment; filename="solicitudes-' . date('Y-m-d') . '.xls"');
				
				header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
				header('Last-Modified: ' . gmdate('D,d M YH:i:s') . ' GMT');
				header('Cache-Control: no-cache, must-revalidate');
				header('Pragma: no-cache');
				
				// Output the spreadsheet in binary format
				$writer = new PHPExcel_Writer_Excel5($excel);
				$writer->save('php://output');
				
				exit;
			}
			
			$u_link = array('view' => $v['view'], 'f' => $v['f']);
			if ($v['view'] == 'search')
			{
				$u_link['ssid'] = $v['ssid'];
			}
			
			$sv = array(
				'TITLE' => $v['a_view']['mode_name'],
				'SIZE' => $total,
				'CURRENT' => $v['offset'],
				'U_ETABLE' => _link($this->m(), array_merge($u_link, array('e' => 'table'))),
				'G_ETABLE' => _lang('TICKET_ETABLE_YES'),
				'U_TICKET' => _link($this->m(), array('x1' => 'view', 'a' => '*', 'offset' => $v['offset'])),
				'U_STATUS' => _link($this->m(), array('x1' => 'search', 'x2' => 'status', 'e' => $v['e']))
			);
			
			foreach ($tickets as $i => $row)
			{
				if (!$i)
				{
					$pags = _pagination(_link($this->m(), $u_link), 'offset:%d', $total, $per_page, $v['offset']);
					_style('tickets', array_merge($sv, $pags));
				}
				
				if (!isset($row['ticket_group']) || !$row['ticket_group']) $row['ticket_group'] = 1;
				
				$ticket_row = array(
					'ID' => $row['ticket_id'],
					'URL' => _link($this->m(), array('x1' => 'view', 'a' => $row['ticket_id'], 'offset' => $v['offset'])),
					'STATUS' => $this->init_status($row['ticket_status']),
					'STATUS_NAME' => $status_list[$row['ticket_status']]['status_name'],
					'TITLE' => dvar($row['ticket_title'], _lang('TICKET_NO_SUBJECT')),
					'TEXT' => _message($row['ticket_text']),
					'START' => _format_date($row['ticket_start']),
					'AUTHOR' => _fullname($row),
					'GROUP' => (($user->v('is_founder'))) ? $groups[$row['ticket_group']]['group_email'] : ''
				);
				
				_style('tickets.row', _vs($ticket_row, 'v'));
				
				if (isset($tech_assoc[$row['ticket_id']]))
				{
					foreach ($tech_assoc[$row['ticket_id']] as $ti => $tech_name)
					{
						if (!$ti) _style('tickets.row.techs');
						
						_style('tickets.row.techs.rowt', array(
							'NAME' => _fullname($tech_name))
						);
					}
				}
				
				if (isset($notes_assoc[$row['ticket_id']]))
				{
					foreach ($notes_assoc[$row['ticket_id']] as $ti => $note_row)
					{
						if (!$ti) _style('tickets.row.notes');
						
						_style('tickets.row.notes.rown', array(
							'TEXT' => $note_row['note_text'],
							'TIME' => _format_date($note_row['note_time']),
							'REALNAME' => _fullname($note_row))
						);
					}
				}
			}
		}
		else
		{
			if ($v['offset'])
			{
				redirect(_link($this->m(), array('view' => $v['view'])));
			}
			
			_style('noresults');
		}
		
		v_style(array(
			'V_CHOWN' => (f($v['f'])) ? $v['f'] : '')
		);
		
		return $this->__home_common($v['offset'], $v['view']);
	}
	
	public function mini()
	{
		if (!_auth_get('ticket_mini', false, true))
		{
			_fatal();
		}
		
		return $this->_template('ticket.mini');
	}
	
	public function view()
	{
		$this->method();
	}
	
	protected function _view_home()
	{
		global $core, $user;
		
		$v = $this->__(array('code', 'a' => 0, 'print' => 0, 'offset' => 0));
		
		if (f($v['code']))
		{
			$sql = 'SELECT ticket_id
				FROM _tickets
				WHERE ticket_code = ?';
			$v['a'] = _field(sql_filter($sql, $v['code']), 'ticket_id');
		}
		
		$d = $this->init_ticket($v['a']);
		$d['ticket_owner'] = ($d['ticket_contact'] == $user->v('user_id')) ? true : false;
		$d['ticket_access'] = false;
		
		if ($user->v('is_founder') || $d['ticket_owner'])
		{
			$d['ticket_access'] = true;
		}
		else
		{
			$sql = 'SELECT g.group_id
				FROM _groups g, _groups_members m
				WHERE g.group_id = m.member_group
					AND m.member_uid = ?';
			if ($s_group_id = _rowset(sql_filter($sql, $user->v('user_id')), false, 'group_id'))
			{
				$sql = 'SELECT *
					FROM _groups g, _groups_members m, _tickets t
					WHERE t.ticket_id = ?
						AND g.group_id = m.member_group
						AND g.group_id = t.ticket_group
						AND t.ticket_group IN (??)';
				if (_fieldrow(sql_filter($sql, $d['ticket_id'], _implode(',', $s_group_id))))
				{
					$d['ticket_access'] = true;
				}
			}
		}
		
		if (!$d['ticket_access'])
		{
			$sql = 'SELECT *
				FROM _tickets t, _tickets_assign a
				WHERE t.ticket_id = ?
					AND t.ticket_id = a.assign_ticket
					AND a.user_id = ?';
			if (_fieldrow(sql_filter($sql, $d['ticket_id'], $user->v('user_id'))))
			{
				$d['ticket_access'] = true;
			}
		}
		
		// TODO: Explain this error friendly
		if (!$d['ticket_access']) _fatal();
		
		$d['ticket_control'] = (!$d['ticket_owner'] || $user->v('is_founder')) ? true : false;
		$this->navigation('TICKET_VIEW', array('x1' => 'view', 'a' => $v['a'], 'offset' => $v['offset']));
		
		//
		$sql = 'SELECT cat_name
			FROM _tickets_cat
			WHERE cat_id = ?';
		$cat_name = _field(sql_filter($sql, $d['ticket_cat']), 'cat_name');
		
		$sql = 'SELECT user_firstname, user_lastname, user_username
			FROM _members
			WHERE user_id = ?';
		$ticket_author = _fieldrow(sql_filter($sql, $d['ticket_contact']));
		
		//
		$status_list = $this->init_status_list();
		$sql_show_public = ($d['ticket_owner'] || ($d['ticket_owner'] && $user->v('is_founder'))) ? true : false;
		
		//
		$sql = 'SELECT a.assign_id, a.assign_status, a.assign_end, m.user_id, m.user_username, m.user_firstname, m.user_lastname
			FROM _members m, _tickets_assign a
			WHERE m.user_id = a.user_id
				AND a.assign_ticket = ?
			ORDER BY m.user_firstname, m.user_lastname';
		$ticket_assign = _rowset(sql_filter($sql, $v['a']));
		
		foreach ($ticket_assign as $i => $row)
		{
			if (!$i) _style('assigned');
			
			if (!isset($status_list[$row['assign_status']])) $row['assign_status'] = $d['ticket_status'];
			
			_style('assigned.row', array(
				'V_AID' => $row['assign_id'],
				'V_ALIAS' => $row['user_username'],
				'V_UID' => $row['user_id'],
				'V_FULLNAME' => _fullname($row),
				'U_PROFILE' => _link('contacts', array('m' => $row['user_username'])),
				
				'V_STATUS' => $status_list[$row['assign_status']]['status_alias'],
				'V_END' => ($row['assign_end']) ? _format_date($row['assign_end']) : '')
			);
		}
		
		$sql = 'SELECT *
			FROM _groups
			ORDER BY group_name';
		$groups = _rowset($sql, 'group_id', 'group_name');
		_rowset_foreach(string_to_array_assoc($groups, w('group_id group_name')), 'groups');
		
		//
		if (!$category = $core->cache_load('tickets_cat'))
		{
			$sql = 'SELECT *
				FROM _tickets_cat
				ORDER BY cat_name';
			$category = $core->cache_store(_rowset($sql));
		}
		
		$ticket_groups = explode(',', $user->auth_groups());
		
		foreach ($category as $i2 => $catrow)
		{
			if (!$catrow['cat_group'] || in_array($catrow['cat_group'], $ticket_groups)) continue;
			
			unset($category[$i2]);
		}
		
		_rowset_foreach($category, 'category');
		
		// Ticket notes
		$sql = 'SELECT n.*, m.user_id, m.user_username, m.user_firstname, m.user_lastname
			FROM _tickets_notes n, _members m
			WHERE n.ticket_id = ?
				??
				AND n.user_id = m.user_id
			ORDER BY n.note_time';
		$notes = _rowset(sql_filter($sql, $d['ticket_id'], (($sql_show_public) ? 'AND n.note_cc = 1 ' : '')));
		
		foreach ($notes as $i => $row)
		{
			if (!$i) _style('notes');
			
			$access = ($row['note_cc']) ? 'public' : 'private';
			
			_style('notes.row', array(
				'U_NOTE_EDIT' => _link($this->m(), array('x1' => 'note', 'x2' => 'modify', 'note' => $row['note_id'])),
				'U_NOTE_REMOVE' => _link($this->m(), array('x1' => 'note', 'x2' => 'remove', 'note' => $row['note_id'])),
				
				'V_NOTE_ID' => $row['note_id'],
				'V_USERNAME' => _fullname($row),
				'V_USERLINK' => _link('contacts', array('m' => $row['user_username'])),
				'V_TIME' => _format_date($row['note_time']),
				'V_TEXT' => _message($row['note_text']),
				'V_ACCESS' => _lang($access),
				'V_ACCESS_CLASS' => ($row['note_cc']) ? 'green' : 'red')
			);
		}
		
		$author_fullname = _fullname($ticket_author);
		
		$sql = 'SELECT assign_status
			FROM _tickets_assign
			WHERE assign_ticket = ?
				AND user_id = ?';
		if ($assign_status = _field(sql_filter($sql, $d['ticket_id'], $user->v('user_id')), 'assign_status', 0))
		{
			$d['ticket_status'] = $assign_status;
		}
		
		v_style(array(
			'U_STATUS' => _link($this->m(), array('x1' => 'ticket', 'x2' => 'status', 'ticket' => $v['a'])),
			'U_GROUP' => _link($this->m(), array('x1' => 'ticket', 'x2' => 'groups', 'a' => $v['a'])),
			'U_ADD_NOTE' => _link($this->m(), array('x1' => 'note', 'x2' => 'create', 'ticket' => $v['a'])),
			'U_CATEGORY' => _link($this->m(), array('x1' => 'ticket', 'x2' => 'cat', 'ticket' => $v['a'])),
			'U_TECH_ADD' => _link($this->m(), array('x1' => 'tech', 'x2' => 'add', 'ticket' => $v['a'])),
			'U_TECH_QUERY' => _link($this->m(), array('x1' => 'tech', 'x2' => 'query', 'ticket' => $v['a'])),
			'U_TECH_REMOVE' => _link($this->m(), array('x1' => 'tech', 'x2' => 'remove', 'ticket' => $v['a'])),
			'U_REMOVE' => _link($this->m(), array('x1' => 'ticket', 'x2' => 'remove', 'ticket' => $v['a'])),
			'U_PRINT' => _link($this->m(), array('x1' => 'view', 'a' => $v['a'], 'print' => 1)),
			
			'V_ID' => $v['a'],
			'V_DELETED' => $d['ticket_deleted'],
			'V_STATUS' => $this->init_status($d['ticket_status']),
			'V_STATUS_ID' => $d['ticket_status'],
			'V_STATUS_NAME' => $status_list[$d['ticket_status']]['status_name'],
			'V_GROUP_NAME' => $groups[$d['ticket_group']],
			'V_CATEGORY' => $cat_name,
			'V_TITLE' => ($d['ticket_title'] != '') ? $d['ticket_title'] : _lang('TICKET_NO_SUBJECT'),
			'V_TEXT' => _message($d['ticket_text']),
			'V_START' => ($d['ticket_start']) ? _format_date($d['ticket_start']) : '',
			'V_END' => ($d['ticket_end']) ? _format_date($d['ticket_end']) : '',
			'V_IP' => $d['ticket_ip'],
			'V_AUTHOR_NAME' => $author_fullname ? $author_fullname : _lang('USER_UNKNOWN'),
			'V_AUTHOR_URL' => _link('contacts', array('m' => $ticket_author['user_username'])),
			'V_SHOW_PUBLIC' => !$sql_show_public)
		);
		$this->__home_common($v['offset']);
		
		if ($v['print'])
		{
			$this->_template('ticket.print');
		}
		
		return;
	}
	
	public function create()
	{
		$this->method();
	}
	
	protected function _create_home()
	{
		global $core, $user;
		
		if (_button() && is_ghost())
		{
			$v = $this->__(array('cat' => 1, 'ticket_group' => 0, 'ticket_title', 'ticket_text', 'ticket_username'));
			$t_contact = $user->v();
			
			if (f($v['ticket_username']) && _auth_get('ticket_create_admin'))
			{
				if (!preg_match('#^([a-z0-9\_\-]+)$#is', $v['ticket_username']))
				{
					$this->_error('#SIGN_LOGIN_ERROR');
				}
				
				$sql = 'SELECT *
					FROM _members
					WHERE user_username = ?
						AND user_id <> 1
						AND user_active = 1';
				if (!$t_contact = _fieldrow(sql_filter($sql, $v['ticket_username'])))
				{
					$this->_error('#SIGN_LOGIN_ERROR');
				}
			}
			
			if (!$ticket_status = $core->cache_load('ticket_status_default'))
			{
				$sql = 'SELECT status_id
					FROM _tickets_status
					WHERE status_default = 1';
				$ticket_status = $core->cache_store(_field($sql, 'status_id', 0));
			}
			
			$v2 = array(
				'code' => substr(md5(unique_id()), 0, 8),
				'childs' => 0,
				'parent' => 0,
				'deleted' => 0,
				'lastreply' => (int) $user->time,
				'group' => $v['ticket_group'],
				'contact' => $t_contact['user_id'],
				'aby' => 0,
				'cat' => $v['cat'],
				'status' => $ticket_status,
				'start' => (int) $user->time,
				'end' => 0,
				'ip' => $user->i_ip,
				'title' => $v['ticket_title'],
				'text' => $v['ticket_text']
			);
			$sql = 'INSERT INTO _tickets' . _build_array('INSERT', prefix('ticket', $v2));
			$v['ticket_id'] = _sql_nextid($sql);
			
			$v = array_merge($v, $v2);
			
			if ($v['parent'])
			{
				$sql = 'UPDATE _tickets SET ticket_childs = ticket_childs + 1
					WHERE ticket_id = ?';
				_sql(sql_filter($sql, $v['ticket_parent']));
			}
			
			if (f($v['ticket_username']))
			{
				$insert_note = array(
					'ticket_id' => (int) $v['ticket_id'],
					'user_id' => $user->v('user_id'),
					'note_text' => _lang('TICKET_CREATE_STAFF'),
					'note_time' => time(),
					'note_cc' => 1
				);
				$sql = 'INSERT INTO _tickets_notes' . _build_array('INSERT', $insert_note);
				_sql($sql);
			}
			
			$sql = 'SELECT group_name, group_email
				FROM _groups
				WHERE group_id = ?';
			$d_group = _fieldrow(sql_filter($sql, $v['ticket_group']));
			
			$ticket_subject = entity_decode($d_group['group_name'] . ' [#' . $v['code'] . ']: ' . $v['ticket_title']);
			$ticket_message = entity_decode($v['text']);
			
			$sql = 'SELECT m.user_email
				FROM _groups_members gm, _members m
				WHERE gm.member_group = ?
					AND gm.member_mod = ?
					AND gm.member_uid = m.user_id
				ORDER BY m.user_email';
			$group_members = _rowset(sql_filter($sql, $v['group'], 1), false, 'user_email');
			
			//
			// Common email notification
			require_once(XFS . 'core/emailer.php');
			$emailer = new emailer();
			
			$emailer_vars = array(
				'USERNAME' => $t_contact['user_username'],
				'FULLNAME' => entity_decode(_fullname($t_contact)),
				'SUBJECT' => entity_decode($v['ticket_title']),
				'MESSAGE' => $ticket_message,
				'TICKET_URL' => _link($this->m(), array('x1' => 'view', 'code' => $v['code']))
			);
			$email_from = $d_group['group_email'] . '@' . $core->v('domain');
			$user_template = 'ticket_' . $d_group['group_email'];
			
			//
			// Notify ticket creator
			$emailer->from($email_from);
			$emailer->set_subject($ticket_subject);
			$emailer->use_template($user_template);
			$emailer->email_address($t_contact['user_email']);
			$emailer->set_decode(true);
			
			$emailer->assign_vars($emailer_vars);
			$emailer->send();
			$emailer->reset();
			
			//
			// Notify group mods
			$emailer->from($email_from);
			$emailer->use_template('ticket_tech');
			$emailer->set_subject($ticket_subject);
			
			foreach ($group_members as $i => $row)
			{
				$method = (!$i) ? 'email_address' : 'cc';
				$emailer->$method($row);
			}
			
			$emailer->set_decode(true);
			$emailer->assign_vars($emailer_vars);
			$emailer->send();
			$emailer->reset();
			
			return $this->e(_link($this->m(), array('x1' => 'view', 'code' => $v['code'])));
		}
		
		$sql = 'SELECT group_id, group_name
			FROM _groups
			ORDER BY group_name';
		_rowset_style($sql, 'groups');
		
		return v_style(array(
			'CHANGE_USER' => sprintf(_lang('TICKET_CHANGE_USER'), _fullname($user->v())))
		);
	}
	
	public function search()
	{
		$this->method();
	}
	
	protected function _search_home()
	{
		$v = $this->__(array('q', 'e'));
		
		ini_set('memory_limit', '100M');
		set_time_limit(0);
		
		$button = _button();
		if ($button)
		{
			$build_search = $this->advanced_search($this->m());
			
			$build = 'SELECT t.*, mb.user_id, mb.user_active, mb.user_firstname, mb.user_lastname
				FROM ' . _implode(', ', $build_search['from']) . '
				WHERE ' . _implode(' ', $build_search['where']) . '
				ORDER BY t.ticket_start DESC';
			redirect(_link($this->m(), array('x1' => 'search', 'q' => array_key(sql_cache($build), 'sid'), 'e' => $v['e'])));
		}
		
		if (f($v['q']))
		{
			$cached = sql_cache('', $v['q']);
			if ($tickets = _rowset($cached['query']))
			{
				redirect(_link($this->m(), array('view' => 'search', 'ssid' => $v['q'], 'e' => $v['e'])));
			}
			$button = true;
		}
		
		$this->advanced_search_form($this->m());
		
		return v_style(array(
			'IS_SUBMIT' => $button,
			'RESULTS_PAGE' => 0,
			'U_SEARCH_TAB' => _link($this->m(), array('x1' => 'tab', 'uid' => '*', 'tag' => '?')))
		);
	}
	
	protected function _search_table()
	{
		global $user;
		
		$v = $this->__(array('table' => 0));
		
		$sql = "SELECT *
			FROM _search_tables t, _search_categories c
			WHERE t.table_id = ?
				AND t.table_cat = c.category_id
				AND c.category_alias = ?";
		if (!_fieldrow(sql_filter($sql, $v['table'], $this->m())))
		{
			$this->_error('', false);
		}
		
		$sql = 'SELECT relation_id, relation_name
			FROM _search_relation
			WHERE relation_table = ?';
		$relation = _rowset(sql_filter($sql, $v['table']));
		
		$response = w();
		foreach ($relation as $i => $row)
		{
			if ($row['relation_name'] == 'Grupo')
			{
				$groups = explode(',', $user->auth_groups());
				
				if (count($groups) < 2) continue;
			}
			
			$response[$i] = array(
				'r_id' => $row['relation_id'],
				'r_name' => $row['relation_name']
			);
		}
		return $this->e(json_encode($response));
	}
	
	protected function _search_field()
	{
		global $user;
		
		$v = $this->__(array('field' => 0));
		
		$sql = 'SELECT *
			FROM _search_relation
			WHERE relation_id = ?';
		if (!$field = _fieldrow(sql_filter($sql, $v['field'])))
		{
			$this->_error('', false);
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
					
					$sql = "SELECT *
						FROM _??_fields
						WHERE field_alias = ?";
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
			case 'yesno':
				$yn = array(
					1 => _lang('YES'),
					0 => _lang('NO')
				);
				$field['relation_input'] = 'select';
				
				$i = 0;
				foreach ($yn as $j => $row)
				{
					if (!$i) _style('select');
					
					_style('select.row', array(
						'V_VALUE' => $j,
						'V_NAME' => $row)
					);
					$i++;
				}
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
	
	protected function _search_status()
	{
		gfatal();
		
		$v = $this->__(array('s', 'e'));
		
		$sql = 'SELECT *
			FROM _tickets_status
			WHERE status_alias = ?';
		if (!$status = _fieldrow(sql_filter($sql, $v['s'])))
		{
			$this->_error('#E_COMPUTER_NO_STATUS');
		}
		
		global $user;
		
		//if (_auth_get('ticket_view_all'))
		if ($user->auth_groups() != -1)
		{
			$build = 'SELECT t.*, mb.user_id, mb.user_active, mb.user_firstname, mb.user_lastname
				FROM _tickets t, _members mb
				WHERE t.ticket_contact = mb.user_id
					AND t.ticket_status = ?
					AND t.ticket_group IN (??)
					AND t.ticket_deleted = 0
				ORDER BY t.ticket_start DESC';
			$build = sql_filter($build, $status['status_id'], $user->auth_groups());
		}
		else
		{
			$build = 'SELECT t.*, mb.user_id, mb.user_active, mb.user_firstname, mb.user_lastname
				FROM _tickets t, _members mb
				WHERE t.ticket_contact = mb.user_id
					AND t.ticket_status = ?
					AND t.ticket_contact = ?
					AND t.ticket_deleted = 0
				ORDER BY t.ticket_start DESC';
			$build = sql_filter($build, $status['status_id'], $user->v('user_id'));
		}
		
		return redirect(_link($this->m(), array('x1' => 'search', 'q' => array_key(sql_cache($build), 'sid'), 'e' => $v['e'])));
	}
	
	//
	public function note()
	{
		$this->method();
	}
	
	protected function _note_home()
	{
		_fatal();
	}
	
	protected function _note_create()
	{
		gfatal();
		
		global $user, $core;
		
		$v = $this->__(array('ticket' => 0, 'note_public' => 0, 'note_text'));
		
		if (!f($v['note_text']))
		{
			_fatal();
		}
		
		$d = $this->init_ticket($v['ticket']);
		$status_list = $this->init_status_list('status_alias', 'status_id');
		
		$d['is_creator'] = $d['ticket_contact'] == $user->v('user_id');
		$v['note_public'] = (!$d['is_creator']) ? $v['note_public'] : 1;
		
		$this_time = time();
		$notify = w();
		
		$sql_insert = array(
			'ticket_id' => $v['ticket'],
			'user_id' => (int) $user->v('user_id'),
			'note_text' => $v['note_text'],
			'note_time' => $this_time,
			'note_cc' => (int) $v['note_public']
		);
		$sql = 'INSERT INTO _tickets_notes' . _build_array('INSERT', $sql_insert);
		_sql($sql);
		
		$sql = 'UPDATE _tickets SET ticket_lastreply = ?
			WHERE ticket_id = ?';
		_sql(sql_filter($sql, $this_time, $v['ticket']));
		
		$sql = 'SELECT group_email
			FROM _groups
			WHERE group_id = ?';
		$group_email = _field(sql_filter($sql, $d['ticket_group']), 'group_email', '');
		
		// Mail
		if (!$d['is_creator'] && $v['note_public'])
		{
			$sql = 'SELECT user_email
				FROM _members
				WHERE user_id = ?';
			$notify = _rowset(sql_filter($sql, $d['ticket_contact']), false, 'user_email');
		}
		
		$sql = 'SELECT m.user_email
			FROM _tickets_assign a, _members m
			WHERE a.assign_ticket = ?
				AND a.user_id <> ?
				AND a.user_id = m.user_id
			ORDER BY m.user_username';
		if ($notify = array_merge($notify, _rowset(sql_filter($sql, $v['ticket'], $user->v('user_id')), false, 'user_email')))
		{
			require_once(XFS . 'core/emailer.php');
			
			$emailer_vars = array(
				'USERNAME' => $user->v('user_username'),
				'FULLNAME' => entity_decode(_fullname($user->v())),
				'SUBJECT' => entity_decode($d['ticket_title']),
				'MESSAGE' => entity_decode($v['note_text']),
				'TICKET_URL' => _link($this->m(), array('x1' => 'view', 'code' => $d['ticket_code']))
			);
			
			$emailer = new emailer();
			$emailer->from($group_email . '@' . $core->v('domain'));
			$emailer->use_template('ticket_reply');
			$emailer->set_subject(sprintf('%s [#%s]: %s', _lang('REPLY'), $d['ticket_code'], $emailer_vars['SUBJECT']));
			
			foreach ($notify as $i => $v_email)
			{
				$method = (!$i) ? 'email_address' : 'cc';
				$emailer->{$method}($v_email);
			}
			
			$emailer->set_decode(true);
			$emailer->assign_vars($emailer_vars);
			$emailer->send();
			$emailer->reset();
		}
		
		return $this->e('~OK');
	}
	
	protected function _note_modify()
	{
		gfatal();
		
		$v = $this->__(array('note' => 0, 'text'));
		
		$sql = 'SELECT *
			FROM _tickets_notes
			WHERE note_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['note'])))
		{
			_fatal();
		}
		
		$sql = 'UPDATE _tickets_notes SET note_text = ?
			WHERE note_id = ?';
		_sql(sql_filter($sql, $v['text'], $v['note']));
		
		return $this->e(_message($v['text']));
	}
	
	protected function _note_remove()
	{
		$v = $this->__(array('note' => 0));
		
		$sql = 'SELECT *
			FROM _tickets_notes
			WHERE note_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['note'])))
		{
			_fatal();
		}
		
		$sql = 'DELETE FROM _tickets_notes
			WHERE note_id = ?';
		_sql(sql_filter($sql, $v['note']));
		
		return $this->e($v['note']);
	}
	
	public function ticket()
	{
		$this->method();
	}
	
	protected function _ticket_home()
	{
		_fatal();
	}
	
	protected function _ticket_modify()
	{
		
	}
	
	protected function _ticket_remove()
	{
		gfatal();
		
		if (!_auth_get('ticket_remove'))
		{
			_fatal();
		}
		
		$v = $this->__(array('ticket' => 0));
		$d = $this->init_ticket($v['ticket']);
		
		$sql = 'UPDATE _tickets SET ticket_deleted = 1
			WHERE ticket_id = ?';
		_sql(sql_filter($sql, $v['ticket']));
		
		return $this->e('~OK');
	}
	
	protected function _ticket_status()
	{
		global $user;
		
		gfatal();
		if (!_auth_get('ticket_update_status'))
		{
			_fatal();
		}
		
		$v = $this->__(array('ticket' => 0, 'status' => 0));
		$d = $this->init_ticket($v['ticket']);
		
		$status = $this->init_status_list();
		if (!isset($status[$v['status']]))
		{
			_fatal();
		}
		
		$ticket_end = ($status[$v['status']]['status_alias'] == 'closed') ? $user->time : 0;
		$rm_id = $d['ticket_status'];
		$assign_id = 0;
		
		$sql = 'SELECT assign_id, assign_status
			FROM _tickets_assign
			WHERE assign_ticket = ?';
		$assigned = _rowset(sql_filter($sql, $v['ticket']));
		
		$sql = 'SELECT *
			FROM _tickets_assign
			WHERE assign_ticket = ?
				AND user_id = ?';
		if ($assign = _fieldrow(sql_filter($sql, $v['ticket'], $user->v('user_id'))))
		{
			$completed = 0;
			foreach ($assigned as $row)
			{
				if (isset($status[$row['assign_status']]) && $status[$row['assign_status']]['status_alias'] == 'closed')
				{
					$completed++;
				}
			}
			
			$rm_id = $assign['assign_status'];
			$count_a = count($assigned);
			$status_closed = ($status[$v['status']]['status_alias'] == 'closed');
			$assign_id = $assign['assign_id'];
			
			if (($count_a == ($completed + 1) && $status_closed) ||($count_a != ($completed - 1) && !$status_closed))
			{
				$sql = 'UPDATE _tickets SET ticket_status = ?, ticket_end = ?
					WHERE ticket_id = ?';
				_sql(sql_filter($sql, $v['status'], $ticket_end, $v['ticket']));
			}
			
			$sql = 'UPDATE _tickets_assign SET assign_status = ?, assign_end = ?
				WHERE assign_id = ?';
			_sql(sql_filter($sql, $v['status'], $ticket_end, $assign['assign_id']));
		}
		else
		{
			if (count($assigned))
			{
				if ($status[$v['status']]['status_alias'] == 'closed')
				{
					$this->_error('CANT_STATUS_CLOSED');
				}
			}
			
			$sql = 'UPDATE _tickets_assign SET assign_status = ?
				WHERE assign_ticket = ?';
			_sql(sql_filter($sql, $v['status'], $v['ticket']));
			
			$sql = 'UPDATE _tickets SET ticket_status = ?, ticket_end = ?
				WHERE ticket_id = ?';
			_sql(sql_filter($sql, $v['status'], $ticket_end, $v['ticket']));
		}
		
		$response = array(
			'rm_id' => $status[$rm_id]['status_id'],
			'add_id' => $status[$v['status']]['status_id'],
			'aid' => $assign_id,
			
			'rm' => $this->init_status($rm_id),
			'add' => $this->init_status($v['status']),
			'name' => $status[$v['status']]['status_name']
		);
		return $this->e(json_encode($response));
	}
	
	protected function _ticket_cat()
	{
		global $user;
		
		gfatal();
		
		if (!_auth_get('ticket_update_cat'))
		{
			_fatal();
		}
		
		$v = $this->__(array('ticket' => 0, 'cat' => 0));
		
		if (!$v['ticket'] || !$v['cat']) _fatal();
		
		$sql = 'SELECT *
			FROM _tickets_cat
			WHERE cat_id = ?';
		if (!$cdata = _fieldrow(sql_filter($sql, $v['cat'])))
		{
			_fatal();
		}
		
		$sql = 'UPDATE _tickets SET ticket_cat = ?
			WHERE ticket_id = ?';
		_sql(sql_filter($sql, $v['cat'], $v['ticket']));
		
		return $this->e($cdata['cat_name']);
	}
	
	protected function _ticket_groups()
	{
		global $user, $core;
		
		gfatal();
		
		if (!_auth_get('ticket_update_group'))
		{
			_fatal();
		}
		
		$v = $this->__(array('a' => 0, 'group' => 0));
		$d = $this->init_ticket($v['a']);
		
		$sql = 'SELECT *
			FROM _groups
			WHERE group_id = ?';
		if (!$v_group = _fieldrow(sql_filter($sql, $v['group'])))
		{
			_fatal();
		}
		
		$sql = 'SELECT user_username, user_firstname, user_lastname
			FROM _members
			WHERE user_id = ?';
		if (!$v_user = _fieldrow(sql_filter($sql, $d['ticket_contact'])))
		{
			_fatal();
		}
		
		require_once(XFS . 'core/emailer.php');
		$emailer = new emailer();
		
		$ticket_subject = entity_decode($v_group['group_name'] . ' [#' . $d['ticket_code'] . ']: ' . $d['ticket_title']);
		$ticket_message = entity_decode($d['ticket_text']);
		
		// Update group
		$sql = 'UPDATE _tickets SET ticket_group = ?
			WHERE ticket_id = ?';
		_sql(sql_filter($sql, $v['group'], $v['a']));
		
		// Notifify group mods
		$sql = 'SELECT m.user_firstname, m.user_lastname, m.user_email
			FROM _members m, _groups_members gm
			WHERE gm.member_group = ?
				AND gm.member_mod = ?
				AND gm.member_uid = m.user_id
			ORDER BY m.user_username';
		$mods = _rowset(sql_filter($sql, $v['group'], 1));
		
		foreach ($mods as $row)
		{
			$emailer->from($v_group['group_email'] . '@' . $core->v('domain'));
			$emailer->email_address($row['user_email']);
			$emailer->use_template('ticket_tech');
			$emailer->set_subject($ticket_subject);
			$emailer->set_decode(true);
			
			$emailer->assign_vars(array(
				'USERNAME' => $v_user['user_username'],
				'FULLNAME' => entity_decode(_fullname($row)),
				'SUBJECT' => entity_decode($d['ticket_title']),
				'MESSAGE' => $ticket_message,
				'TICKET_URL' => _link($this->m(), array('x1' => 'view', 'code' => $d['ticket_code'])))
			);
			$emailer->send();
			$emailer->reset();
		}
		
		return $this->e($v_group['group_name']);
	}
	
	public function tech()
	{
		$this->method();
	}
	
	protected function _tech_add()
	{
		global $user, $core;
		
		gfatal();
		
		if (!_auth_get('ticket_assign_tech') && !_auth_get('ticket_auto_assign'))
		{
			_fatal();
		}
		
		$v = $this->__(array('ticket' => 0, 'tech'));
		
		if (_auth_get('ticket_auto_assign') && !$user->v('is_founder') && $user->v('user_username') != $v['tech'])
		{
			$this->_error('NO_ASSIGN_OTHER');
		}
		
		$sql = 'SELECT *
			FROM _tickets t, _groups g
			WHERE t.ticket_id = ?
				AND t.ticket_group = g.group_id';
		if (!$tdata = _fieldrow(sql_filter($sql, $v['ticket'])))
		{
			$this->_error('NOT_MEMBER_2');
		}
		
		$sql = 'SELECT user_id
			FROM _members
			WHERE user_username = ?';
		$v['tech'] = _field(sql_filter($sql, $v['tech']), 'user_id', 0);
		
		$sql = 'SELECT *
			FROM _members
			WHERE user_id = ?';
		if (!$techdata = _fieldrow(sql_filter($sql, $v['tech'])))
		{
			$this->_error('NOT_MEMBER');
		}
		
		$sql = 'SELECT ticket_id
			FROM _tickets
			WHERE ticket_contact = ?
				AND ticket_id = ?';
		if ($row1 = _field(sql_filter($sql, $v['tech'], $v['ticket']), 'ticket_id', 0))
		{
			$this->_error('CANT_ASSIGN');
		}
		
		$sql = 'SELECT *
			FROM _tickets_assign
			WHERE user_id = ?
				AND assign_ticket = ?';
		if ($row2 = _fieldrow(sql_filter($sql, $v['tech'], $v['ticket'])))
		{
			$this->_error('ALREADY_ASSIGN');
		}
		
		$sql = 'SELECT *
			FROM _members
			WHERE user_id = ?';
		if (!$cdata = _fieldrow(sql_filter($sql, $tdata['ticket_contact'])))
		{
			$this->_error('NOT_MEMBER_3');
		}
		
		$sql_insert = array(
			'assign_ticket' => $v['ticket'],
			'user_id' => $v['tech'],
			'assign_status' => $tdata['ticket_status'],
			'assign_end' => 0
		);
		$sql = 'INSERT INTO _tickets_assign' . _build_array('INSERT', $sql_insert);
		_sql($sql);
		
		// Send notification
		require_once(XFS . 'core/emailer.php');
		$emailer = new emailer();
		
		$ticket_subject = entity_decode($tdata['group_name'] . ' [#' . $tdata['ticket_code'] . ']: ' . $tdata['ticket_title']);
		$ticket_message = entity_decode($tdata['ticket_text']);
		
		$emailer->from($tdata['group_email'] . '@' . $core->v('domain'));
		$emailer->email_address($techdata['user_email']);
		$emailer->use_template('ticket_tech');
		$emailer->set_subject($ticket_subject);
		
		$emailer->assign_vars(array(
			'USERNAME' => $techdata['user_username'],
			'FULLNAME' => entity_decode(_fullname($cdata)),
			'SUBJECT' => entity_decode($tdata['ticket_title']),
			'MESSAGE' => $ticket_message,
			'TICKET_URL' => _link($this->m(), array('x1' => 'view', 'code' => $tdata['ticket_code'])))
		);
		$emailer->send();
		$emailer->reset();
		
		return $this->e(_fullname($cdata));
	}
	
	protected function _tech_query()
	{
		global $user;
		
		gfatal();
		
		$v = $this->__(array('tech'));
		if (!f($v['tech']))
		{
			_fatal();
		}
		
		$sql = "SELECT user_id, user_firstname, user_lastname
			FROM _members
			WHERE user_firstname LIKE '%??%'";
		$members = _rowset(sql_filter($sql, $v['tech']));
		
		$ret = '';
		foreach ($members as $row)
		{
			$ret .= '<li id="' . $row['user_id'] . '">' . _fullname($row) . '</li>';
		}
		
		return $this->e('<ul>' . $ret . '</ul>');
	}
	
	protected function _tech_remove()
	{
		$v = $this->__(array('tech' => 0));
		
		$sql = 'SELECT *
			FROM _tickets_assign
			WHERE assign_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['tech'])))
		{
			_fatal();
		}
		
		$sql = 'DELETE FROM _tickets_assign
			WHERE assign_id = ?';
		_sql(sql_filter($sql, $v['tech']));
		
		return $this->e($v['tech']);
	}
	
	public function cat()
	{
		$this->method();
	}
	
	protected function _cat_home()
	{
		global $user;
		
		$v = $this->__(array('g' => 0));
		
		if ($v['g'])
		{
			$sql = 'SELECT group_id
				FROM _groups
				WHERE group_id = ?';
			if (!_field(sql_filter($sql, $v['g']), 'group_id', 0))
			{
				_fatal();
			}
		}
		
		$sql = 'SELECT c.cat_id, c.cat_name, g.group_name AS group_alias, g.group_email
			FROM _tickets_cat c, _groups g
			WHERE c.cat_id > 0
				-- AND g.group_id = ?
				AND c.cat_group = g.group_id
				AND g.group_id IN (??)
			ORDER BY cat_group, cat_name';
		if (!$cat = _rowset_style(sql_filter($sql, $v['g'], $user->auth_groups()), 'cat'))
		{
			_style('no_cat');
		}
		
		$sql = 'SELECT group_id, group_name, group_email
			FROM _groups
			WHERE group_id IN (??)
			ORDER BY group_name';
		_rowset_style(sql_filter($sql, $user->auth_groups()), 'groups');
		
		return;
	}
	
	protected function _cat_create()
	{
		gfatal();
		
		$v = $this->__(array('group' => 0, 'name'));
		
		if (!f($v['name']))
		{
			$this->_error('#FIELD_IS_EMPTY');
		}
		
		if ($v['group'])
		{
			$sql = 'SELECT group_id
				FROM _groups
				WHERE group_id = ?';
			if (!_fieldrow(sql_filter($sql, $v['group'])))
			{
				$this->_error('#GROUPS_NO_EXISTS');
			}
		}
		
		$sql = 'INSERT INTO _tickets_cat' . _build_array('INSERT', prefix('cat', $v));
		_sql($sql);
		
		return $this->e('~OK');
	}
	
	protected function _cat_call()
	{
		gfatal();
		
		$v = $this->__(array('el' => 0));
		
		$sql = 'SELECT *
			FROM _tickets_cat
			WHERE cat_id = ?';
		if (!$cat = _fieldrow(sql_filter($sql, $v['el'])))
		{
			_fatal();
		}
		
		$response = array(
			'id' => $v['el'],
			'group' => $cat['cat_group'],
			'name' => $cat['cat_name']
		);
		return $this->e(json_encode($response));
	}
	
	protected function _cat_modify()
	{
		gfatal();
		
		$v = $this->__(array('el' => 0, 'c_group' => 0, 'c_name'));
		
		if (!f($v['c_name']))
		{
			$this->_error('#FIELD_IS_EMPTY');
		}
		
		$sql = 'SELECT *
			FROM _tickets_cat
			WHERE cat_id = ?';
		if (!_fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#TICKET_CAT_NO');
		}
		
		if ($v['c_group'])
		{
			$sql = 'SELECT group_id
				FROM _groups
				WHERE group_id = ?';
			if (!_fieldrow(sql_filter($sql, $v['c_group'])))
			{
				$this->_error('#GROUPS_NO_EXISTS');
			}
		}
		
		$sql = 'UPDATE _tickets_cat SET cat_group = ?, cat_name = ?
			WHERE cat_id = ?';
		_sql(sql_filter($sql, $v['c_group'], $v['c_name'], $v['el']));
		
		return $this->e('~OK');
	}
	
	protected function _cat_remove()
	{
		gfatal();
		
		$v = $this->__(array('el' => 0));
		
		$sql = 'SELECT *
			FROM _tickets_cat
			WHERE cat_id = ?';
		if (!$cat = _fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#TICKET_CAT_NO');
		}
		
		$sql = 'SELECT ticket_id
			FROM _tickets
			WHERE ticket_cat = ?';
		if ($aaa = _fieldrow(sql_filter($sql, $v['el'])))
		{
			$this->_error('#TICKET_CAT_CANT_REMOVE');
		}
		
		$sql = 'DELETE FROM _tickets_cat
			WHERE cat_id = ?';
		_sql(sql_filter($sql, $v['el']));
		
		return $this->e('~OK');
	}
}

?>