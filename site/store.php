<?php

session_start();

if (isset($_SESSION['user_email'])) {
}
else{
  
  header('Location: index.php');
  exit();
}


$ch = curl_init();
$url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/items';

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
$items = json_decode($response, true);

// echo '<pre>';print_r($items);echo '</pre>';exit;

// Process the retrieved data
// ...


?>

<!doctype html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">


  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

  <!-- datatable cdn  -->
  <link href="https://cdn.datatables.net/1.13.5/css/jquery.dataTables.min.css">

  <!-- DataTables CSS -->
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/dataTables.bootstrap4.min.css">
  <title>store</title>
  <style>
    * {
      padding: 0;
      margin: 0;
      box-sizing: border-box;
    }

    header {
      width: 100vw;
      height: 80px;
      background: linear-gradient(89.96deg, #88B6E0 7.81%, #ABD4FA 92.72%);
      border-radius: 8px;
      /* background-color: skyblue; */
      display: flex;
      justify-content: space-between;
    }

    .container-fluid {
      padding: 0px !important;
    }

    .main_part {
      width: 80%;
    }

    tr td {
      color: #187FA3;
    }
  </style>

</head>

<body>

  <div class="container-fluid">
    <header>
      <div class="logo">

        <div style="margin-left: 17px;
            display: flex;
            margin-top: 12px;">
          <img src="logo.png" alt="" style="width: 45px;height: 45px;">

        </div>
        <!-- <p style="margin-top: 19px;
           padding-left: 48px;
           margin-bottom: 1rem;color:white">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 0C15.8565 0 17.637 0.737498 18.9497 2.05025C20.2625 3.36301 21 5.14348 21 7C21 8.85652 20.2625 10.637 18.9497 11.9497C17.637 13.2625 15.8565 14 14 14C12.1435 14 10.363 13.2625 9.05025 11.9497C7.7375 10.637 7 8.85652 7 7C7 5.14348 7.7375 3.36301 9.05025 2.05025C10.363 0.737498 12.1435 0 14 0ZM14 17.5C21.735 17.5 28 20.6325 28 24.5V28H0V24.5C0 20.6325 6.265 17.5 14 17.5Z" fill="white" />
          </svg>

          Mesob Store
        </p> -->
      </div>
      <div>
      </div>
      <div style="display: flex;flex-direction:row;">



      </div>

      <div>
        <a href="store.php" class="btn btn-primary" style="margin-top: 16px;
            margin-right: 15px;background: #FFFFFF;
color:black">
          <i class="fa fa-edit"></i> Orders
        </a>


        <a href="notification.php" class="btn btn-primary" style="margin-top: 16px;
            margin-right: 15px;background: #FFFFFF;
color:black">
          <i class="fa fa-edit"></i> Notification
        </a>

      </div>

      <div class="logout">
        <button onclick="logout()" class="btn btn-primary" style="margin-top: 16px;
            margin-right: 15px;background: #FFFFFF;
box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
border-radius: 30px;color:black">
          <svg width="19" height="12" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8007 14.0118H15.359C15.2606 14.0118 15.1683 14.0548 15.1068 14.1307C14.9632 14.305 14.8094 14.4732 14.6474 14.6331C13.9848 15.2964 13.1999 15.825 12.3362 16.1897C11.4414 16.5676 10.4796 16.7615 9.50817 16.7598C8.52585 16.7598 7.57428 16.567 6.68014 16.1897C5.81641 15.825 5.03153 15.2964 4.36891 14.6331C3.70511 13.9721 3.1758 13.1886 2.81032 12.326C2.43093 11.4319 2.2402 10.4824 2.2402 9.50003C2.2402 8.51771 2.43298 7.5682 2.81032 6.67406C3.17536 5.81068 3.70036 5.03343 4.36891 4.36693C5.03747 3.70042 5.81471 3.17542 6.68014 2.81038C7.57428 2.43304 8.52585 2.24027 9.50817 2.24027C10.4905 2.24027 11.4421 2.43099 12.3362 2.81038C13.2016 3.17542 13.9789 3.70042 14.6474 4.36693C14.8094 4.52894 14.9612 4.6971 15.1068 4.86937C15.1683 4.94525 15.2627 4.98831 15.359 4.98831H16.8007C16.9299 4.98831 17.0099 4.84476 16.9382 4.73607C15.3652 2.29154 12.6131 0.673469 9.48561 0.681672C4.57194 0.693976 0.63239 4.68275 0.681609 9.59027C0.730827 14.4199 4.66423 18.3184 9.50817 18.3184C12.6274 18.3184 15.3673 16.7024 16.9382 14.264C17.0079 14.1553 16.9299 14.0118 16.8007 14.0118ZM18.6239 9.37083L15.7138 7.07396C15.6051 6.98782 15.4472 7.06575 15.4472 7.20316V8.76175H9.00778C8.91755 8.76175 8.84372 8.83558 8.84372 8.92581V10.0743C8.84372 10.1645 8.91755 10.2383 9.00778 10.2383H15.4472V11.7969C15.4472 11.9343 15.6072 12.0122 15.7138 11.9261L18.6239 9.62923C18.6435 9.61388 18.6594 9.59427 18.6703 9.57189C18.6812 9.54951 18.6868 9.52493 18.6868 9.50003C18.6868 9.47513 18.6812 9.45056 18.6703 9.42817C18.6594 9.40579 18.6435 9.38618 18.6239 9.37083Z" fill="#153667" />
          </svg>

          Logout</button>
      </div>
    </header>

    <div class="main_part mx-auto mt-5" style="background: #FFFFFF;
    box-shadow: 5px 4px 4px rgba(0, 0, 0, 0.25);">
      <table class="table" id="mytable" style="width: 100%;">
        <thead>
          <tr>
            <td>ID</td>
            <th>Name</th>
            <th>phone</th>
            <th>City</th>
            <th>isSender</th>
            <th>Action</th>

          </tr>
        </thead>
        <tbody>
          <?php $count = 0;
          foreach ($items as $item) {
            $count++;
            if ($item['id']) {
          ?>
              <tr>
                <td><?php echo $count; ?></td>
                <td><?php echo (isset($item['name'])) ? $item['name'] : '' ?></td>
                <td><?php echo (isset($item['phone'])) ? $item['phone'] : '' ?></td>
                <td><?php echo (isset($item['city'])) ? $item['city'] : '' ?></td>
                <td><?php echo (isset($item['isSender'])) ? $item['isSender'] : '' ?></td>

                <td>
                  <a href="orderdetails.php?id=<?php echo $item['id'] ?>" class="btn btn-sm btn-primary">
                    <i class="fa fa-edit"></i> View
                  </a>
                  <a href="edit.php?id=<?php echo $item['id'] ?>" class="btn btn-sm btn-success">
                    <i class="fa fa-edit"></i> Edit
                  </a>
                </td>
              </tr>

          <?php }
          } ?>

        </tbody>


      </table>
    </div>
  </div>

  <!-- jQuery first, then DataTables JS, then Bootstrap JS -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  <script src="https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.10.25/js/dataTables.bootstrap4.min.js"></script>


  <!-- Optional JavaScript -->
  <!-- jQuery first, then Popper.js, then Bootstrap JS -->
  <!-- <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script> -->
  <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  <!-- Bootstrap and other scripts -->

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  <script>
    $(document).ready(function() {
      $('#mytable').DataTable();
    });


    function logout(){
      window.location.href = "logout.php";
    }
  </script>
</body>

</html>