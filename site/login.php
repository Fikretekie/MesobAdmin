<?php 
session_start();
$email = $_POST['email'];
$password = $_POST['password'];



if($email && $password != null){
    $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/login';

    

    $data = array(
        'email' => $email,
        'Password' => $password
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
        if($response == '"success"'){
            // echo $response;exit;
            $_SESSION['user_email'] = $email;  
            header('location: store.php');
        }
        else{
            // echo 'kashif'. $response;exit;
            header('Location: index.php');
        }
    }

    curl_close($ch);
}


else{
    echo 'Please enter correct email address and password.';
}
?>