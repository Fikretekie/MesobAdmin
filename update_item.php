<?php
    $itemJson = $_POST['Item'];
    $itemArray = json_decode($itemJson, true);
    $senderArray = json_decode($itemArray['senderAddress'], true)
    ;
    // echo "<pre>";
    // print_r($itemArray);

    // print_r($senderArray);
    // exit;

    // Initialize total price
    $totalSellingPrice = 0.0;
    // Initialize table HTML
    $tableHTML = '';
    // Initialize row counter
    $srNo = 1;

    // Check if Products array exists and is an array
    if (isset($itemArray['Products']) && is_array($itemArray['Products'])) {
        // Loop through each product
        foreach ($itemArray['Products'] as $product) {
            // Check if price exists
            if (isset($product['price'])) {
                // Trim the price string to remove any leading/trailing spaces
                $priceStr = trim($product['price']);
                // Remove the $ sign and convert the string to a float
                $priceFloat = floatval(str_replace('$', '', $priceStr));

                // Add to total selling price
                $totalSellingPrice += $priceFloat;

                // Generate table row HTML
                $tableHTML .= '
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px;">' . $srNo . '</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">' . htmlspecialchars($product['title']) . '</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">' . htmlspecialchars($product['country']) . '</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">' . htmlspecialchars($product['qty']) . '</td>
                    <td style="border: 1px solid #ccc; padding: 8px;">' . htmlspecialchars($product['price']) . '</td>
                </tr>';
                
                // Increment row counter
                $srNo++;
            }
        }
    }
// Output the total price
// echo "Total Price: $" . number_format($totalSellingPrice, 2);

//     // Output the complete table
//     echo '
//     <table style="border-collapse: collapse; width: 100%;">
//         <thead>
//             <tr>
//                 <th style="border: 1px solid #ccc; padding: 8px;">Sr No.</th>
//                 <th style="border: 1px solid #ccc; padding: 8px;">Name</th>
//                 <th style="border: 1px solid #ccc; padding: 8px;">Country</th>
//                 <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
//                 <th style="border: 1px solid #ccc; padding: 8px;">Selling Price</th>
//             </tr>
//         </thead>
//         <tbody>
//             ' . $tableHTML . '
//         </tbody>
//     </table>';
// 
//     exit;

$id = $_GET['id'];
$Status = isset($_POST['Status']) ? $_POST['Status'] : null;
$sender_email = isset($_POST['sender_email']) ? $_POST['sender_email'] : null;
$recepient_email = isset($_POST['recepient_email']) ? $_POST['recepient_email'] : null;
// $trackingCompany = $_POST['trackingCompany'];
// $trackingNo = $_POST['trackingNo'];
$trackingCompany = isset($_POST['trackingCompany']) ? $_POST['trackingCompany'] : '';
$trackingNo = isset($_POST['trackingNo']) ? $_POST['trackingNo'] : '';

if($_POST['Status'] == 'Ordered') {
    // $message = 'Dear Customer, you order has been placed.';
    // $message = ' <div style="display: flex; align-items: center;">
    // <h2 style="font-style: italic; color: black; margin-right: 10px;">
    //     <span style="color: red;">M</span>esob 
    //     <span style="color: red;">S</span>tore
    // </h2>
    // <div style=" display: flex; justify-content: center; align-items: center;">
    // <img style="max-width: 30px; height: 30px;vertical-align: middle;" src="http://admin.mesobstore.com/app-icon.png" alt="Your Logo">
    // </div>
    // </div>
    // <p style="color:black;">Dear customer, <br> Thank you for yp on our platform. We hope you find our products and services valuable for your money.</p>
    // <p style="color:black;">Your order has been placed.</p>
    // <br />
    // <p style="color:black;">Thank You</p>
    // <span>
    //     <p style="color:black;"><span style="color:red; ">M</span>esob <span style="color:red ">S</span>tore Team</p>
    // </span>  
    // ';


    $message = '
                <div style="display: flex; align-items: center;">
                    <h2 style="margin: 0; font-style: italic; color: black; margin-right: 10px;">
                        <span style="color: red;">M</span>esob 
                        <span style="color: red;">S</span>tore
                    </h2>
                    <div style="display: flex; justify-content: center; align-items: center;">
                        <img style="max-width: 30px; height: 30px;" src="http://admin.mesobstore.com/app-icon.png" alt="Your Logo">
                    </div>
                </div>
                <p>Dear Customer,</p>
                <p>Thank you for your recent purchase from Mesob Store! We are delighted to confirm that your order has been successfully placed.</p>
                <p>Our team is now processing your order and you will receive a notification once it has been shipped.</p>
                <p>If you have any questions or need further assistance, please don\'t hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521.</p>
                <br/>
                <p>We appreciate your business and look forward to serving you again!</p>
                <h2>Order Details:</h2>
                <table style="border-collapse: collapse; width: 100%;">
                    <thead>
                        <tr>
                            <th style="border: 1px solid #ccc; padding: 8px;">Sr No.</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Name</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Country</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Quantity</th>
                            <th style="border: 1px solid #ccc; padding: 8px;">Selling Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ' . $tableHTML . '
                    </tbody>
                </table>
                <p>Total Amount: ' . $totalSellingPrice . '</p>
                <h3>Receiver</h3>
                <ul>
                    <li>Contact Name: ' . (isset($itemArray['name']) ? $itemArray['name'] : '-') . '</li>
                    <li>Phone number: ' . (isset($itemArray['phone']) ? $itemArray['phone'] : '-') . '</li>
                    <li>City: ' . (isset($itemArray['city']) ? $itemArray['city'] : '-') . '</li>
                    <li>Address: ' . (isset($itemArray['address']) ? $itemArray['address'] : '-') . '</li>
                </ul>
                <h3>Sender</h3>
                <ul>
                    <li>Contact Name: ' . (isset($senderArray['name']) ? $senderArray['name'] : '-') . '</li>
                    <li>Email: ' . (isset($senderArray['email']) ? $senderArray['email'] : '-') . '</li>
                    <li>Phone number: ' . (isset($senderArray['phone']) ? $senderArray['phone'] : '-') . '</li>
                    <li>City: ' . (isset($senderArray['city']) ? $senderArray['city'] : $sCity) . '</li>
                    <li>Address: ' . (isset($senderArray['address']) ? $senderArray['address'] : '-') . '</li>
                    <li>State: ' . (isset($senderArray['state']) ? $senderArray['state'] : '-') . '</li>
                    <li>Zip Code: ' . (isset($senderArray['pincode']) ? $senderArray['pincode'] : '-') . '</li>
                </ul>
                <br />
                <p>Thank You </p>
                <span>
                    <p style="color:black;"><span style="color:red;">M</span>esob <span style="color:red">S</span>tore Team</p>
                </span>';

    $subject = 'Thank You for Your Order!';
    
} else if($_POST['Status'] == 'Shipped'){
    $message = '<div style="display: flex; align-items: center;">
    <h2 style="font-style: italic; color: black; margin-right: 10px;">
        <span style="color: red;">M</span>esob 
        <span style="color: red;">S</span>tore
    </h2>
    <div style=" display: flex; justify-content: center; align-items: center;">
    <img style="margin-top:5px; max-width: 35px; height: 35px;vertical-align: middle;" src="http://admin.mesobstore.com/app-icon.png" alt="Your Logo">
    </div>
    </div>
<p style="color:black;">Dear customer,<br />
We are excited to let you know that your order has been shipped!<br />
If you have any questions or need further assistance, please don\'t hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521.
<br />
<br />
Thank you for shopping with Mesob Store! We hope you enjoy your purchase and look forward to serving you again.</p>';

if (!empty($trackingCompany) && !empty($trackingNo)) {
    $message .= '<p style="color:black;">Tracking Number: ' . $trackingCompany . ' - ' . $trackingNo . '.</p>';
}

$message .= '<br />
<p>Best regards,</p>
<span>
    <p style="color:black;"><span style="color:red;">M</span>esob <span style="color:red;">S</span>tore Team</p>
</span>';
$subject = 'Your Order Has Shipped!';
} else {
    $message = ' <div style="display: flex; align-items: center;">
    <h2 style="font-style: italic; color: black; margin-right: 10px;">
        <span style="color: red;">M</span>esob 
        <span style="color: red;">S</span>tore
    </h2>
      <div style=" display: flex; justify-content: center; align-items: center;">
    <img style="margin-top:5px; max-width: 35px; height: 35px;vertical-align: middle;" src="http://admin.mesobstore.com/app-icon.png" alt="Your Logo">
    </div>
</div>
    <p style="color:black;">Dear Customer, <br />
    We are pleased to inform you that your order has been successfully delivered! <br />  
    We hope you are delighted with your purchase! If you have any questions or need any assistance, please do not hesitate to contact our customer service team at mesob@mesobstore.com or 614-580-7521 <br />  <br />
    Your feedback is important to us. If you have a moment, please let us know about your shopping experience by leaving a review. <br/>  
    
    Google play link <br />
     <a href="https://play.google.com/store/apps/details?id=com.mesob.store.app&pcampaignid=web_share" target="_blank">https://play.google.com/store/apps/details?id=com.mesob.store.app&pcampaignid=web_share</a> 
     <br />
     <br />

     Apple store link <br />

          <a href="https://apps.apple.com/us/app/mesob-store/id1617565954" target="_blank">https://apps.apple.com/us/app/mesob-store/id1617565954</a>
           <br />
            <br />
    Thank you for choosing mesobstore.com. We look forward to serving you again soon!

     <br />
   

    </p>
    <br />
    <p style="color:black;">Best regards,</p> <br />
    <p style="color:black;">Thank You</p>

<span>
    <p style="color:black;"><span style="color:red; ">M</span>esob <span style="color:red ">S</span>tore Team</p>
</span>  
    ';
    $subject = 'Your Order Has Been Delivered!';
}


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


        function api_send_mail($payload) {
            $uri = 'https://q0v1vrhy5g.execute-api.us-east-1.amazonaws.com/staging'; // API URL
            $jsonPayload = json_encode($payload);

            // Initialize cURL session
            $ch = curl_init($uri);

            // Set cURL options
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, array(
                'Content-Type: application/json'
            ));
            curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPayload);

            // Execute cURL request
            $response = curl_exec($ch);

            // Check for errors
            if ($response === false) {
                $error = curl_error($ch);
                curl_close($ch);
                throw new Exception('cURL Error: ' . $error);
            }

            // Close cURL session
            curl_close($ch);

            // Decode JSON response
            $responseData = json_decode($response, true);

            // Log response
            error_log('res====,' . print_r($responseData, true));
            
            return $responseData;
        }

        // Usage for Sender Email
        try {
            $payload = array(
                'email' => $sender_email,
                'message' => $message,
                'subject' => $subject,
            );
            $response = api_send_mail($payload);
        } catch (Exception $e) {
            echo 'Error: ' . $e->getMessage();
        }

        // Usage for Recepient Email
        try {
            $payload = array(
                'email' => $recepient_email,
                'message' => $message,
                'subject' => $subject,
            );
            $response = api_send_mail($payload);
        } catch (Exception $e) {
            echo 'Error: ' . $e->getMessage();
        }

        header('location: edit.php?id='.$id);
    }

    curl_close($ch);
} else {
    die('Invalid or missing input. ID: ' . $id . ', Status: ' . $Status);
}


?>