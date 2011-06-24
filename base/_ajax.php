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

class __ajax extends xmd
{
	public function __construct()
	{
		parent::__construct();
		
		$this->_m(array(
			'create' => w('create_brand create_model create_domain create_workgroup create_contact list_prov list_tech create_brand_id models_for_features'))
		);
	}
	
	public function home()
	{
		return request_type_redirect();
	}
	
	public function create()
	{
		request_type_redirect();
		
		return $this->method();
	}
	
	protected function _create_home()
	{
		return true;
	}
	
	protected function _create_create_contact()
	{
		$v = $this->__(w('contact'));
		
		$sql = "SELECT user_id, user_firstname, user_lastname
			FROM _members
			WHERE user_firstname LIKE '??%'";
		$list = _rowset(sql_filter($sql, $v['contact']));
		
		$contacts = w();
		foreach ($list as $row)
		{
			$contacts[$row['user_id']] = _fullname($row);
		}
		return $this->_dom_ul_id($contacts);
	}
	
	protected function _create_create_domain()
	{
		$domain = $this->v('domain', '');
		if (!f($domain))
		{
			$this->e();
		}
		
		$sql = "SELECT *
			FROM _pc_domains
			WHERE dom_text LIKE '??%'";
		$list = _rowset(sql_filter($sql, $domain), 'dom_id', 'dom_text');
		return $this->_dom_ul_id($list);
	}
	
	protected function _create_create_workgroup()
	{
		$workgroup = $this->v('workgroup', '');
		if (!f($workgroup))
		{
			$this->e();
		}
		
		$sql = "SELECT *
			FROM _pc_workgroups
			WHERE wg_text LIKE '??%'";
		$list = _rowset(sql_filter($sql, $workgroup), 'wg_id', 'wg_text');
		return $this->_dom_ul_id($list);
	}
	
	protected function _create_list_prov()
	{
		$prov = $this->v('prov', '');
		if (!f($prov))
		{
			$this->e();
		}
		
		$sql = "SELECT prov_id, prov_name
			FROM _prov
			WHERE prov_name LIKE '??%'";
		$list = _rowset(sql_filter($sql, $prov), 'prov_id', 'prov_name');
		return $this->_dom_ul_id($list);
	}
	
	protected function _create_list_tech()
	{
		$tech = $this->v('tech', '');
		if (!f($tech))
		{
			$this->e();
		}
		
		$sql = "SELECT pc_technology
			FROM _pc
			WHERE pc_technology LIKE '??%'";
		$list = _rowset(sql_filter($sql, $tech), false, 'pc_technology');
		return $this->_dom_ul($list);
	}
	
	protected function _create_models_for_features()
	{
		$v = $this->__(array('brand' => 0, 'model' => ''));
		if (!f($v['brand']) || !f($v['model']))
		{
			$this->e();
		}
		
		$sql = "SELECT model_name
			FROM _models
			WHERE model_brand = ?
				AND model_name LIKE '??%'";
		$list = _rowset(sql_filter($sql, $v['brand'], $v['model']), false, 'model_name');
		return $this->_dom_ul($list);
	}
	
	protected function _ticket_members()
	{
		$v = $this->__(w('change_user'));
		
		$sql = "SELECT user_id, username
			FROM _members
			WHERE user_firstname LIKE '??%'
			ORDER BY user_firstname";
		$list = _rowset(sql_filter($sql, $v['change_user']));
		
		$members = w();
		foreach ($list as $row)
		{
			$members[$row['user_id']] = _fullname($row);
		}
		return $this->_dom_ul($members);
	}
	
	private function _dom_ul($ary)
	{
		if (sizeof($ary))
		{
			echo '<ul>';
			foreach ($ary as $str)
			{
				echo '<li>' . $str . '</li>';
			}
			echo '</ul>';
		}
		
		return $this->e();
	}
	
	private function _dom_ul_id($ary)
	{
		if (sizeof($ary))
		{
			echo '<ul>';
			foreach ($ary as $id => $str)
			{
				echo '<li id="' . $id . '">' . $str . '</li>';
			}
			echo '</ul>';
		}
		
		return $this->e();
	}
}

?>