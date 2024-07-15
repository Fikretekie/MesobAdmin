<?php

$id = $_GET['id'];
$Status = isset($_POST['Status']) ? $_POST['Status'] : null;

if ($id && $Status !== null) {
    $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/items/' . $id .'?Status='.$Status;

    

    $data = array(
        'Status' => $Status
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
    ]);

    $response = curl_exec($ch);
    if (curl_errno($ch)) {
        $error_message = curl_error($ch);
        echo 'cURL Error: ' . $error_message;
        // Handle the error
    } else {
        // $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        // echo 'HTTP Code: ' . $http_code;
        // echo 'Response: ' . $response;
        header('location: edit.php?id='.$id);
    }

    curl_close($ch);
} else {
    die('Invalid or missing input. ID: ' . $id . ', Status: ' . $Status);
}


?>