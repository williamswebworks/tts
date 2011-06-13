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

interface i_cron
{
	public function ticket();
	public function optimize();
}

class __cron extends xmd implements i_cron
{
	public function __construct()
	{
		parent::__construct();
		
		$this->_m(_array_keys(w('ticket optimize')));
		$this->auth(false);
	}
	
	public function home()
	{
		_fatal();
	}
	
	// SVN: Import method removed on 209
	
	public function ticket()
	{
		$this->method();
	}
	
	protected function _ticket_home()
	{
		global $user, $core;
		
		if (!$core->v('cron_enabled'))
		{
			return $this->e('CRON_DISABLED');
		}
		
		foreach (w('mail pop3 emailer htmlparser') as $row)
		{
			require_once(XFS . 'core/' . $row . '.php');
		}
		
		$pop3 = new pop3();
		
		if (!$pop3->connect($core->v('mail_server'), $core->v('mail_port')))
		{
			return $this->e('MAIL_NO_CONNECT');
		}
		
		if (!$total_mail = $pop3->login('recent:' . $core->v('mail_ticket_login'), $core->v('mail_ticket_key')))
		{
			return $this->e('MAIL_NEW_MAIL');
		}
		
		//
		$mail = new _mail();
		$emailer = new emailer();
		
		//
		if (!$blacklist = $core->cache_load('ticket_blacklist'))
		{
			$sql = 'SELECT *
				FROM _tickets_blacklist
				ORDER BY list_id';
			$blacklist = $core->cache_store(_rowset($sql, 'list_address', 'list_id'));
		}
		
		if (!$ticket_status = $core->cache_load('ticket_status_default'))
		{
			$sql = 'SELECT status_id
				FROM _tickets_status
				WHERE status_default = 1';
			$ticket_status = $core->cache_store(_field($sql, 'status_id', 0));
		}
		
		$sql = 'SELECT group_id, group_email
			FROM _groups
			ORDER BY group_email';
		$groups = _rowset($sql, 'group_email', 'group_id');
		
		$sql = 'SELECT group_email, group_name
			FROM _groups
			ORDER BY group_email';
		$groups_name = _rowset($sql, 'group_email', 'group_name');
		
		$sql = 'SELECT gg.group_email, m.user_email
			FROM _groups gg, _groups_members g, _members m
			WHERE g.member_mod = ?
				AND g.member_uid = m.user_id
				AND gg.group_id = g.member_group
			ORDER BY m.user_email';
		$groups_mods = _rowset(sql_filter($sql, 1), 'group_email', 'user_email', true);
		
		foreach ($groups as $a_group_email => $a_group_id)
		{
			if (!isset($groups_mods[$a_group_email]))
			{
				$groups_mods[$a_group_email] = w();
			}
		}
		
		$sql = 'SELECT s.a_assoc, s.a_value
			FROM _members_fields f, _members_store s
			WHERE s.a_field = f.field_id
				AND f.field_alias LIKE ?
			ORDER BY s.a_value';
		$email_alt = _rowset(sql_filter($sql, 'email%'), 'a_value', 'a_assoc');
		
		// Pre mail process
		$recv = w();
		$now = time();
		$line_orig = array('&nbsp;');
		$line_repl = array(' ');
		
		$_v = w('from from_d to ticket subject body date mod ip spam blacklist reply other');
		$_c = w('normal reply other blacklist spam', 0);
		
		for ($i = 1; $i <= $total_mail; $i++)
		{
			foreach ($_v as $row)
			{
				${'recv_' . $row} = 0;
			}
			
			$s_header = $mail->parse_header(split("\r\n", implode('', $pop3->top($i))));
			
			$recv_from = $mail->parse_address($s_header['from']);
			if (isset($blacklist[$recv_from]))
			{
				$recv_blacklist = 1;
			}
			
			if ($recv_from == $core->v('mail_ticket_login'))
			{
				$recv_blacklist = 1;
			}
			
			_dvar($s_header['to'], '');
			_dvar($s_header['cc'], '');
			
			if (f($s_header['cc']))
			{
				$s_header['to'] .= ((f($s_header['to'])) ? ', ' : '') . $s_header['cc'];
			}
			
			$to_part = array_map('trim', explode(((strpos($s_header['to'], ',')) ? ',' : ';'), $s_header['to']));
			foreach ($to_part as $row)
			{
				if (strpos($row, '<') !== false)
				{
					$row = preg_replace('#.*?<(.*?)>#is', '\\1', $row);
				}
				
				if (isset($blacklist[$row]))
				{
					$recv_blacklist = 1;
				}
				else
				{
					$recv_blacklist = 0;
					
					$row_first = array_key(explode('@', $row), 0);
					if (isset($groups[$row_first]))
					{
						$recv_to = $row_first;
					}
				}
			}
			
			if (strstr($s_header['to'], _lang('MAIL_TO_UNKNOWN')) !== false)
			{
				$recv_to = array_key(explode('@', $core->v('mail_ticket_login')), 0);
			}
			
			if (!$recv_to)
			{
				$recv_blacklist = 1;
			}
			
			if (!$recv_blacklist)
			{
				$recv_subject = htmlencode(trim($s_header['subject']));
				
				if (preg_match('#\[\#(.*?)\]#is', $recv_subject, $p_subject))
				{
					$sql = 'SELECT ticket_id
						FROM _tickets
						WHERE ticket_code = ?';
					if ($recv_subject_d = _fieldrow(sql_filter($sql, $p_subject[1])))
					{
						$recv_ticket = $recv_subject_d['ticket_id'];
						$recv_reply = $p_subject[1];
						$recv_subject = substr(strrchr($recv_subject, ']'), 3);
					}
				}
				
				if ($recv_to . '@' . $core->v('domain') == $recv_from && $recv_from == $core->v('mail_ticket_login') && $recv_reply)
				{
					$recv_blacklist = 1;
				}
			}
			
			if (!$recv_blacklist)
			{
				if (isset($email_alt[$recv_from]))
				{
					$sql_field = 'id';
					$sql_value = $email_alt[$recv_from];
				}
				else
				{
					$sql_field = 'username';
					$sql_value = array_key(explode('@', $recv_from), 0);
				}
				
				$sql = 'SELECT user_id, user_username, user_firstname, user_lastname
					FROM _members
					WHERE user_?? = ?';
				if ($recv_from_d = _fieldrow(sql_filter($sql, $sql_field, $sql_value)))
				{
					$recv_from_d = serialize(array_row($recv_from_d));
				}
				else
				{
					$recv_other = 1;
				}
				
				$d_body = $mail->body($s_header, $pop3->fbody($i), true);
				$recv_date = $mail->parse_date($s_header['date']);
				$recv_ip = $mail->parse_ip($s_header['received']);
				
				if (isset($groups_email[$recv_to]))
				{
					$recv_mod = $groups_email[$recv_to];
				}
				
				if ($recv_date > $now || ($recv_date < $now - 86400))
				{
					$recv_date = $now;
				}
				
				if (isset($d_body['text-plain']) && f($d_body['text-plain']))
				{
					$recv_body = trim($d_body['text-plain']);
				}
				elseif (isset($d_body['text-html']) && f($d_body['text-html']))
				{
					$htm_text = w();
					$tag_open = false;
					
					$parser = new HtmlParser($d_body['text-html']);
					while ($parser->parse())
					{
						$line = trim(str_replace($line_orig, $line_repl, $parser->iNodeValue));
						if ($tag_open || strpos($line, '<') !== false)
						{
							$tag_open = !$tag_open;
							continue;
						}
						
						if ($parser->iNodeName == 'Text' && f($line))
						{
							$htm_text[] = preg_replace("/(\r\n){1}/", ' ', $line);
						}
					}
					$recv_body = implode("\n", $htm_text);
				}
				
				if (f($recv_body))
				{
					$recv_body = htmlencode(_utf8($recv_body));
				}
				
				if (!f($recv_body))
				{
					$recv_blacklist = 1;
				}
			}
			
			$recv[$i] = w();
			foreach ($_v as $row)
			{
				$recv[$i][$row] = ${'recv_' . $row};
			}
		}
		
		foreach ($recv as $i => $row)
		{
			if ($row['spam'] || $row['blacklist'])
			{
				$pop3->delete($i);
				
				$row_key = ($row['spam']) ? 'spam' : 'blacklist';
				$_c[$row_key]++;
				continue;
			}
			
			// Send mail to group admin
			if ($row['other'])
			{
				$_c['other']++;
				
				if (count($groups_mods[$row['to']]))
				{
					foreach ($groups_mods[$row['to']] as $i => $mod_email)
					{
						$email_func = (!$i) ? 'email_address' : 'cc';
						$emailer->$email_func($mod_email);
					}
					
					$emailer->from($row['from']);
					$emailer->replyto($row['from']);
					$emailer->set_subject(entity_decode($row['subject']));
					$emailer->use_template('ticket_other');
					$emailer->set_decode(true);
					$emailer->assign_vars(array(
						'SUBJECT' => entity_decode($row['subject']),
						'MESSAGE' => entity_decode($row['body']))
					);
					$emailer->send();
					$emailer->reset();
				}
				
				$pop3->delete($i);
				continue;
			}
			
			$row['code'] = ($row['reply']) ? $row['reply'] : substr(md5(unique_id()), 0, 8);
			$row['from_d'] = unserialize($row['from_d']);
			$row['group_id'] = $groups[$row['to']];
			$row['msubject'] = entity_decode(sprintf('%s [#%s]: %s', $groups_name[$row['to']], $row['code'], $row['subject']));
			$row['mbody'] = explode("\n", $row['body']);
			
			//
			$body_const = w();
			foreach ($row['mbody'] as $part_i => $part_row)
			{
				if (isset($row['mbody'][($part_i - 1)]) && f($row['mbody'][($part_i - 1)]) && f($row['mbody'][$part_i]))
				{
					$row['mbody'][$part_i] = "\n" . $part_row;
				}
			}
			$row['body'] = implode("\n", $row['mbody']);
			
			$v_mail = array(
				'USERNAME' => $row['from_d']['user_username'],
				'FULLNAME' => entity_decode(_fullname($row['from_d'])),
				'SUBJECT' => entity_decode($row['subject']),
				'MESSAGE' => entity_decode($row['body']),
				'TICKET_URL' => _link('ticket', array('x1' => 'view', 'code' => $row['code']))
			);
			
			if (!$row['reply'])
			{
				$_c['normal']++;
				
				$sql_insert = array(
					'parent' => 0,
					'cat' => 1,
					'group' => $row['group_id'],
					'title' => _subject($row['subject']),
					'text' => _prepare($row['body']),
					'code' => $row['code'],
					'contact' => $row['from_d']['user_id'],
					'aby' => 0,
					'status' => $ticket_status,
					'start' => $row['date'],
					'lastreply' => $row['date'],
					'end' => 0,
					'ip' => $row['ip']
				);
				$sql = 'INSERT INTO _tickets' . _build_array('INSERT', prefix('ticket', $sql_insert));
				_sql($sql);
				
				// Send mail to user
				$emailer->email_address($row['from']);
				$emailer->from($row['to'] . '@' . $core->v('domain'));
				$emailer->set_subject($row['msubject']);
				$emailer->use_template('ticket_' . $row['to']);
				$emailer->set_decode(true);
				$emailer->assign_vars($v_mail);
				$emailer->send();
				$emailer->reset();
				
				// > Send mail to group admin
				if (count($groups_mods[$row['to']]))
				{
					foreach ($groups_mods[$row['to']] as $i => $mod_email)
					{
						$address_func = (!$i) ? 'email_address' : 'cc';
						$emailer->$address_func($mod_email);
					}
					
					$emailer->from($row['to'] . '@' . $core->v('domain'));
					$emailer->set_subject($row['msubject']);
					$emailer->use_template('ticket_' . (($row['reply']) ? 'reply' : 'tech'));
					$emailer->set_decode(true);
					$emailer->assign_vars($v_mail);
					$emailer->send();
					$emailer->reset();
				}
			}
			else
			{
				$_c['reply']++;
				$sql_insert = array(
					'ticket_id' => $row['ticket'],
					'user_id' => $row['from_d']['user_id'],
					'note_text' => htmlencode($row['body']),
					'note_time' => $row['date'],
					'note_cc' => 1
				);
				$sql = 'INSERT INTO _tickets_notes' . _build_array('INSERT', $sql_insert);
				_sql($sql);
				
				$sql = 'UPDATE _tickets SET ticket_lastreply = ?
					WHERE ticket_id = ?';
				_sql(sql_filter($sql, $row['date'], $row['ticket']));
				
				// Send mail to group members || user
				$sql = 'SELECT *
					FROM _tickets_assign a, _members m
					WHERE a.assign_ticket = ?
						AND a.user_id = m.user_id
						AND m.user_username NOT IN (?)';
				$tech = _rowset(sql_filter($sql, $row['ticket'], $row['from_d']['user_username']));
				
				if ($row['mod'] != $row['from_d']['user_username'])
				{
					$tech[] = $row['mod'];
				}
				
				if (count($tech))
				{
					foreach ($tech as $tech_i => $tech_row)
					{
						$m_method = (!$tech_i) ? 'email_address' : 'cc';
						$emailer->{$m_method}($tech_row . '@' . $core->v('domain'));
					}
					
					$emailer->from($row['to'] . '@' . $core->v('domain'));
					$emailer->use_template('ticket_reply');
					$emailer->set_subject($row['msubject']);
					$emailer->set_decode(true);
					$emailer->assign_vars($v_mail);
					$emailer->send();
					$emailer->reset();
				}
			}
			
			// Delete mail from server
			$pop3->delete($i);
		}
		
		// Quit server
		$pop3->quit();
		
		$ret = '';
		foreach ($_c as $k => $v)
		{
			$ret .= "\n" . $k . ' = ' . $v . '<br />';
		}
		return $this->e($ret);
	}
	
	public function optimize()
	{
		return $this->method();
	}
	
	protected function _optimize_home()
	{
		$tables = array();
		
		$sql = 'SHOW TABLES';
		foreach (_rowset($sql) as $row)
		{
			foreach ($row as $v) $tables[] = $v;
		}
		
		$sql = 'OPTIMIZE TABLE ' . _implode(', ', $tables);
		_sql($sql);
		
		return $this->e('Done.');
	}
}

?>