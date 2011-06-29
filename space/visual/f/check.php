<?php
// Uploadify v1.6.2
// Copyright (C) 2009 by Ronnie Garcia
// Co-developed by Travis Nickels
$files = array();

$where = $_SERVER['DOCUMENT_ROOT'] . implode('/', array_splice(explode('/', $_SERVER['SCRIPT_NAME']), 0, -3)) . 'f/';

foreach ($_POST as $key => $value) {
	if (file_exists($where . $value)) $files[$key] = $value;
}

echo json_encode($files);
?>