<?php 
$title = $_POST['title'];
$body = $_POST['msg_body'];
$description = $_POST['description'];




if ($title && $body && $description !== null) {
    $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/notification_topic?arn=arn:aws:sns:us-east-1:807954077262:EnpointTopic';
    // $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/notification_topic?title='+$title+'&body='+$body+'$description='+$description;

    $data = array(
        'Title' => $title,
        'Body' => $body,
        'Description' => $description
    );

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
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

        header('location: notification.php?msg=success');
    }

    curl_close($ch);
} else {
    die('Invalid');
}
?>