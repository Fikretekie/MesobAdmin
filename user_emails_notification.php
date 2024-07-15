<?php
if ( $_SERVER[ 'REQUEST_METHOD' ] == 'POST' ) {
    // Retrieve form data
    $subject = $_POST[ 'subject' ];
    $message = $_POST[ 'message' ];
    $user_emails = $_POST[ 'user_emails' ];
    // Comma-separated list of emails

    // Output the submitted data
    // echo 'Subject: ' . htmlspecialchars( $subject ) . '<br>';
    // echo 'Message: ' . htmlspecialchars( $message ) . '<br>';
    
    // Split user emails into an array
    // echo 'emails: ' . htmlspecialchars( $user_emails ) . '<br>'; exit;
    // $emails = explode( ',', $user_emails );

    // // Display emails as an unordered list
    // echo 'User Emails:<br>';
    // echo '<ul>';
    // foreach ( $emails as $email ) {
    //   echo '<li>' . htmlspecialchars( trim( $email ) ) . '</li>';
    // }
    // echo '</ul>';

    function api_send_mail( $payload ) {
        $uri = 'https://q0v1vrhy5g.execute-api.us-east-1.amazonaws.com/staging';
        // API URL
        $jsonPayload = json_encode( $payload );

        // Initialize cURL session
        $ch = curl_init( $uri );

        // Set cURL options
        curl_setopt( $ch, CURLOPT_POST, 1 );
        curl_setopt( $ch, CURLOPT_RETURNTRANSFER, true );
        curl_setopt( $ch, CURLOPT_HTTPHEADER, array(
            'Content-Type: application/json'
        ) );
        curl_setopt( $ch, CURLOPT_POSTFIELDS, $jsonPayload );

        // Execute cURL request
        $response = curl_exec( $ch );

        // Check for errors
        if ( $response === false ) {
            $error = curl_error( $ch );
            curl_close( $ch );
            throw new Exception( 'cURL Error: ' . $error );
        }

        // Close cURL session
        curl_close( $ch );

        // Decode JSON response
        $responseData = json_decode( $response, true );

        // Log response
        error_log( 'res====,' . print_r( $responseData, true ) );

        return $responseData;
    }

    // Usage for User Emails
    try {
        $payload = array(
            'email' => $user_emails,
            'message' => $message,
            'subject' => $subject,
        );
        $response = api_send_mail( $payload );
    } catch ( Exception $e ) {
        echo 'Error: ' . $e->getMessage();
    }

    header( 'location: users.php' );
} else {
    // Handle invalid requests
    http_response_code( 405 );
    echo 'Method Not Allowed';
}
?>
