<?php
$user_email = isset( $_POST[ 'user_email' ] ) ? $_POST[ 'user_email' ] : null;
$subject = isset( $_POST[ 'subject' ] ) ? $_POST[ 'subject' ] : null;
$body = isset( $_POST[ 'body' ] ) ? $_POST[ 'body' ] : null;

if ( $user_email && $subject !== null && $body !== null ) {
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

    // Usage
    try {
        $payload = array(
            'email' => $user_email,
            // 'email' => 'uneebmalik99@gmail.com',
            'message' => $body,
            'subject' => $subject,
        );
        $response = api_send_mail( $payload );
    } catch ( Exception $e ) {
        echo 'Error: ' . $e->getMessage();
    }

    header( 'location: users.php?msg=success' );

}