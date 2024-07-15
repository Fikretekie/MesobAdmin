<?php
session_start();
if (isset($_SESSION['user_email'])) {
    header('Location: store.php');
    exit;
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

    <title>login</title>
    <style>
        body {
            width: 100vw;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .login_div{
            width: 850px;
            display: flex;
            height: 65vh;
            justify-content: center;
            align-items: center;
            box-shadow: 5px 5px 4px 4px rgba(0, 0, 0, 0.25);
            
        }
        .login_div div
        {
            text-align: center;
            
        }
    </style>

  </head>
  <body>

    <div class="login_div">
        <div class="col-12">
            <div style="margin-left: 17px;
            display: flex;
            margin-top: 12px;">
               <img src="logo1.jpeg" alt="" style="width: 90px;height: 90px;">
                    
            </div>
            <h2 style="font-family: 'Inter';
            font-style: normal;
            font-weight: 500;
            font-size: 34px;
            line-height: 65px;
            
            color: #3578DD;">LOGIN</h2>
            <p style="color: #6D5182;">Welome! Login to access the Mesob Store</p>
            <p style="color: #6D5182;">Did you <a href="#" style="color: #6D5182;">Forgot Password ?</a>  </p>
            <div class="container-fluid">
                <div class="row">
                    
                    <div class="col-12 mb-5">
                        <form class="mt-5" method="post" action="login.php">
                            <div class="form-group">
                                <!-- <label for="email">Email:</label> -->
                                <input type="email" class="form-control" id="email" name="email"  placeholder="Enter Email" required style="border-top:none;border-left:none;border-right:none;border-bottom: 1px solid linear-gradient(to right, #8930CB 100%, #2C77E7 100%)!important;">
                            </div>
                
                            <div class="form-group">
                                <!-- <label for="password">Password:</label> -->
                                <input type="password" class="form-control" id="password" name="password" placeholder="Enter Password" required style="border-top:none;border-left:none;border-right:none;border-bottom: 1px solid linear-gradient(to right, #8930CB 100%, #2C77E7 100%)!important;">
                            </div>
                
                            <button type="submit" class="btn btn-primary" style="background: linear-gradient(90deg, rgba(122, 97, 141, 0.72) 50%, #67A4FF 125.08%);
                            box-shadow: 0px 6px 9px rgba(128, 164, 219, 0.56);
                            border-radius: 38px;border-radius: 38px;padding: 5px 60px;">Login</button>
                        </form>
                    </div>
                </div>
            </div>
           
            
        </div>

    </div>
    

    <!-- Optional JavaScript -->
    <!-- jQuery first, then Popper.js, then Bootstrap JS -->
    <script src="https://code.jquery.com/jquery-3.2.1.slim.min.js" integrity="sha384-KJ3o2DKtIkvYIK3UENzmM7KCkRr/rE9/Qpg6aAZGJwFDMVNA/GpGFF93hXpG5KkN" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/popper.js@1.12.9/dist/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
  </body>
</html>