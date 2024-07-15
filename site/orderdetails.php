<?php
session_start();
if (isset($_SESSION['user_email'])) {
}
else{
  
  header('Location: index.php');
  exit();
}


$id = isset($_GET['id']) ? $_GET['id'] : null;
if ($id) {
  $ch = curl_init();
  // $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/users/' . $id;
  $url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/items/' . $id;


  curl_setopt($ch, CURLOPT_URL, $url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer YOUR_API_TOKEN',
  ]);

  $response = curl_exec($ch);



  if (curl_errno($ch)) {
    $error_message = curl_error($ch);
    // Handle the error
  }

  curl_close($ch);

  $item = json_decode($response, true);

  if (isset($item['Item']['senderAddress'])) {

    $sender_Data = json_decode($item['Item']['senderAddress'], true);
  }

  // echo "<pre>";
  // print_r($item['Item']['Products']);
  // echo "</pre>";
  // exit;


} else {
  die;
}


?>

<!doctype html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">

  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

  <title>Order Details</title>
  <style>
    * {
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }

    header {
      width: 100vw;
      height: 80px;
      background: linear-gradient(89.86deg, #88B6E0 47.57%, #ABD4FA 93.38%);
      border-radius: 8px;
      display: flex;
      color: white;
      justify-content: space-between;
    }

    .container-fluid {
      padding: 0px !important;
    }

    .main_part {
      width: 80%;
    }
  </style>

</head>

<body>

  <div class="container-fluid">
    <header>
      <div class="logo">
        <p style="margin-top: 19px;
           padding-left: 48px;
           margin-bottom: 1rem;color:white "> Order Details</p>
      </div>

    </header>


  </div>

  <button class="btn m-3" style="background-color: #88B6E0;color:white" onclick="backtomain()">Back To Home</button>
  <br>

  <div class="container-fluid p-4">
    <div class="main_part mx-auto mt-2 w-90 p-4" style="background: #FFFFFF;
            border: 2px solid #2C77E7;
            box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
            border-radius: 10px;">

      <div class="form-group d-flex">
        <label for="id">ID:</label>
        <input type="text" class="form-control w-50 ml-5" id="id" aria-describedby="emailHelp" placeholder="ID" name="id" value="<?php echo (isset($item['Item']['id'])) ? $item['Item']['id'] : '' ?>" readonly>
      </div>
      <div style="
    display: flex;
    flex-direction: row;
    /* margin-left: 10px; */
">




        <div class="mx-auto mt-2 p-4 m-2" style="background: #FFFFFF;
    border: 2px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;width:48%;">
          <h5>Sender Info</h5>
          <hr>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Name:</label>
            <span><?php echo (isset($sender_Data['name'])) ? $sender_Data['name'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Email:</label>
            <span><?php echo (isset($sender_Data['email'])) ? $sender_Data['email'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Phone:</label>
            <span><?php echo (isset($sender_Data['phone'])) ? $sender_Data['phone'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Pincode:</label>
            <span><?php echo (isset($sender_Data['pincode'])) ? $sender_Data['pincode'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">State:</label>
            <span><?php echo (isset($sender_Data['state'])) ? $sender_Data['state'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">City:</label>
            <span><?php echo (isset($sender_Data['city'])) ? $sender_Data['city'] : '' ?></span>
          </div>
        </div>

        <div class="mx-auto p-4 m-2" style="background: #FFFFFF;
    border: 2px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;width:48%;">
          <h5>Receiver Info</h5>
          <hr>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Name:</label>
            <span><?php echo (isset($item['Item']['name'])) ? $item['Item']['name'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Phone:</label>
            <span><?php echo (isset($item['Item']['phone'])) ? $item['Item']['phone'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Address:</label>
            <span><?php echo (isset($item['Item']['address'])) ? $item['Item']['address'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">State:</label>
            <span><?php echo (isset($item['Item']['state'])) ? $item['Item']['state'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">City:</label>
            <span><?php echo (isset($item['Item']['city'])) ? $item['Item']['city'] : '' ?></span>
          </div>

          <div class="form-group d-flex justify-content-between">
            <label for="sender">Country:</label>
            <span><?php echo (isset($item['Item']['country'])) ? $item['Item']['country'] : '' ?></span>
          </div>
        </div>





      </div>

      <div class="main_part mx-auto mt-2 w-100 p-3" style="background: #FFFFFF;
    border: 1px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;">

        <label for="sender">Products</label>


        <table class="table">
          <thead>
            <tr>
              <td>Sr.</td>
              <th>Product Title</th>
              <th>Category</th>
              <th>Description</th>
              <th>qty</th>
              <th>Price</th>
              <th>Cost</th>

            </tr>
          </thead>
          <tbody>
            <?php $count = 0;
            $total_price = 0;
            $total_cost = 0;
            foreach ($item['Item']['Products'] as $item) {
              $count++;
              // Remove $ price
              $price = str_replace('$', '', $item['price']);
              $tprice = str_replace(',', '', $price);
              $total_price += ($item['qty'] * $tprice);
              // Remove $ price
              $cost = str_replace('$', '', $item['cost']);
              $tcost = str_replace(',', '', $cost);
              $total_cost += ($item['qty'] * $tcost);


            ?>
              <tr>
                <td><?php echo $count; ?></td>
                <td><?php echo (isset($item['title'])) ? $item['title'] : '' ?></td>
                <td><?php echo (isset($item['category'])) ? $item['category'] : '' ?></td>
                <td><?php echo (isset($item['description'])) ? $item['description'] : '' ?></td>
                <td><?php echo (isset($item['qty'])) ? $item['qty'] : '' ?></td>
                <td><?php echo $item['price'] ?></td>
                <td><?php echo $item['cost'] ?></td>



              </tr>

            <?php }
            ?>

          </tbody>


        </table>






      </div>

      <br>
      
      <div class="d-flex justify-content-between">
          <div class="form-group d-flex justify-content-between ml-2" style="background: #FFFFFF;
    border: 1px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;padding: 1px 26px;">
            <label for="sender">Seeling Price:</label>
            <span class="ml-4"><?php echo $total_price; ?></span>
          </div>

          <div class="form-group d-flex justify-content-between mr-4" style="background: #FFFFFF;
    border: 1px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;padding: 1px 26px;">
            <label for="sender">Cost Price:</label>
            <span class="ml-4"><?php echo $total_cost; ?></span>
          </div>
        </div>




        <script>
          function backtomain(){
            window.location.href = "store.php";
          }
        </script>





            <!-- Optional JavaScript -->
            <!-- jQuery first, then Popper.js, then Bootstrap JS -->
            <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
            <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
</body>

</html>