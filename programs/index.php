<?php
$dirs = glob(getcwd() . '/*' , GLOB_ONLYDIR);;

$output = "[";
for ($i = 0; $i < sizeof($dirs); $i++) {
	$output .= '{"program":"' . stripslashes(htmlspecialchars(substr($dirs[$i],strlen(getcwd())+1))) . '","description":"' . stripslashes(htmlspecialchars(file_get_contents($dirs[$i] . "/description.txt"))) . '"}';
	
	if ($i+1 < sizeof($dirs)) {
		$output .= ',';
	}
}
$output .= "]";

die($output);
?>