<?php
session_start();
// Clear all session variables
$_SESSION = [];

// Destroy the session
session_destroy();

// Redirect to the login page or any other page
header('Location: index.php');
exit();

?>