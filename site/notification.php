<?php

session_start();
if (isset($_SESSION['user_email'])) {
}
else{
  
  header('Location: index.php');
  exit();
}



if (isset($_GET['msg'])) {
    $msg = $_GET['msg'];
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

    <title>Notification</title>
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
           margin-bottom: 1rem;color:white">Notification</p>
            </div>
        </header>
    </div>
    <button class="btn m-3" style="background-color: #88B6E0;color:white" onclick="backtomain()">Back To Home</button>

    <?php if (isset($msg)) { ?>
        <div class="bg-greeen text-center h-25 w-100 info info-alert">
            <p class="info-alert-message">Notification sent successfully!</p>
        </div>
    <?php } ?>
    <div class="container-fluid p-4" style="width: 100vw;height: 80vh;display: flex;justify-content: center;align-items: center;">
        <div class="main_part mx-auto w-50 p-4" style="background: #FFFFFF;
    border: 2px solid #2C77E7;
    box-shadow: 13px 18px 27px rgba(0, 0, 0, 0.25);
    border-radius: 10px;">
            <form action="send_notification.php" method="post">
                <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" class="form-control" id="title" aria-describedby="emailHelp" placeholder="Title" name="title" value="">
                </div>
                <div class="form-group">
                    <label for="msg_body">Body</label>
                    <input type="text" class="form-control" name="msg_body" id="msg_body" placeholder="Message" value="">
                </div>
                <div class="form-group">
                    <label for="description">Description</label>
                    <input type="text" class="form-control" id="description" placeholder="Description" name="description" value="">
                </div>

                <div class="form-group d-flex justify-content-center">
                    <button type="submit" class="btn btn-primary" style="background: #88B6E0; border-radius: 10px;">Submit</button>
                </div>
            </form>

        </div>
    </div>


    <script>
        function backtomain() {
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