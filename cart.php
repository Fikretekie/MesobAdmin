<?php

session_start();

if (isset($_SESSION['user_email'])) {
}
else{
  
  header('Location: index.php');
  exit();
}


$ch = curl_init();
$url = 'https://9k4d3mwmtg.execute-api.us-east-1.amazonaws.com/dev/users';

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
$users = json_decode($response, true);

// Sort the items based on updatedAt in descending order
usort($users['Items'], function($a, $b) {
  return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
});

// echo '<pre>';print_r($users['Items']);echo '</pre>';exit;

// Process the retrieved data
// ...

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

  <!-- Font Awesome 4 cdn -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">

  <!-- Bootstrap CSS -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.0.0/dist/css/bootstrap.min.css" integrity="sha384-Gn5384xqQ1aoWXA+058RXPxPg6fy4IWvTNh0E263XmFcJlSAwiGgFAW/dAiS6JXm" crossorigin="anonymous">

  <!-- datatable cdn  -->
  <link href="https://cdn.datatables.net/1.13.5/css/jquery.dataTables.min.css">

  <!-- DataTables CSS -->
  <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.25/css/dataTables.bootstrap4.min.css">
  <title>Cart</title>
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

    /* Custom Style */
    .sticky-header th {
      position: sticky;
      top: 0;
      z-index: 1;
      background-color: #343a40; /* Adjust background color as needed */
      color: white; /* Adjust text color as needed */
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
          <img src="logo1.jpeg" alt="" style="width: 45px;height: 45px;">

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
        <a href="store.php" class="btn btn-primary" style="margin-top: 16px; margin-right: 15px;background: #FFFFFF; color:black">
          <i class="fa fa-archive"></i> Orders
        </a>
        <a href="users.php" class="btn btn-primary" style="margin-top: 16px; margin-right: 15px;background: #FFFFFF; color:black">
          <i class="fa fa-shopping-cart"></i> Cart
        </a>
        <a href="users.php" class="btn btn-primary" style="margin-top: 16px; margin-right: 15px;background: #FFFFFF; color:black">
          <i class="fa fa-users"></i> Users
        </a>
        <a href="notification.php" class="btn btn-primary" style="margin-top: 16px; margin-right: 15px;background: #FFFFFF; color:black">
          <i class="fa fa-bell"></i> Notification
        </a>
      </div>

      <div class="logout">
        <button onclick="logout()" class="btn btn-primary" style="margin-top: 16px; margin-right: 15px;background: #FFFFFF; box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25); border-radius: 30px;color:black">
          <svg width="19" height="12" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16.8007 14.0118H15.359C15.2606 14.0118 15.1683 14.0548 15.1068 14.1307C14.9632 14.305 14.8094 14.4732 14.6474 14.6331C13.9848 15.2964 13.1999 15.825 12.3362 16.1897C11.4414 16.5676 10.4796 16.7615 9.50817 16.7598C8.52585 16.7598 7.57428 16.567 6.68014 16.1897C5.81641 15.825 5.03153 15.2964 4.36891 14.6331C3.70511 13.9721 3.1758 13.1886 2.81032 12.326C2.43093 11.4319 2.2402 10.4824 2.2402 9.50003C2.2402 8.51771 2.43298 7.5682 2.81032 6.67406C3.17536 5.81068 3.70036 5.03343 4.36891 4.36693C5.03747 3.70042 5.81471 3.17542 6.68014 2.81038C7.57428 2.43304 8.52585 2.24027 9.50817 2.24027C10.4905 2.24027 11.4421 2.43099 12.3362 2.81038C13.2016 3.17542 13.9789 3.70042 14.6474 4.36693C14.8094 4.52894 14.9612 4.6971 15.1068 4.86937C15.1683 4.94525 15.2627 4.98831 15.359 4.98831H16.8007C16.9299 4.98831 17.0099 4.84476 16.9382 4.73607C15.3652 2.29154 12.6131 0.673469 9.48561 0.681672C4.57194 0.693976 0.63239 4.68275 0.681609 9.59027C0.730827 14.4199 4.66423 18.3184 9.50817 18.3184C12.6274 18.3184 15.3673 16.7024 16.9382 14.264C17.0079 14.1553 16.9299 14.0118 16.8007 14.0118ZM18.6239 9.37083L15.7138 7.07396C15.6051 6.98782 15.4472 7.06575 15.4472 7.20316V8.76175H9.00778C8.91755 8.76175 8.84372 8.83558 8.84372 8.92581V10.0743C8.84372 10.1645 8.91755 10.2383 9.00778 10.2383H15.4472V11.7969C15.4472 11.9343 15.6072 12.0122 15.7138 11.9261L18.6239 9.62923C18.6435 9.61388 18.6594 9.59427 18.6703 9.57189C18.6812 9.54951 18.6868 9.52493 18.6868 9.50003C18.6868 9.47513 18.6812 9.45056 18.6703 9.42817C18.6594 9.40579 18.6435 9.38618 18.6239 9.37083Z" fill="#153667" />
          </svg>Logout</button>
      </div>
    </header>

    <?php if (isset($msg)) { ?>
        <div class="alert alert-success alert-dismissible fade show m-3" role="alert">
            Email sent successfully!
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    <?php } ?>

    <div class="main_part mx-auto mt-5" style="background: #FFFFFF; box-shadow: 5px 4px 4px rgba(0, 0, 0, 0.25);">
      <div class="d-flex justify-content-end mb-3">
        <a href="#" class="btn btn-info position-relative" data-toggle="modal" data-target="#selectedEmailsModal">
          Cart <span class="badge badge-light" id="selectedEmailsCount">0</span>
        </a>
      </div>
      <table class="table" id="userTable" style="width: 100%;">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all"></th>
            <th>ID</th>
            <th>User ID</th>
            <th>Email</th>
            <th>Cart Count</th>
            <th>Updated At</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <?php $count = 0;
          foreach ($users['Items'] as $user) {
            $count++;
            if ($user['id']) {
          ?>
              <tr>
                <td><input type="checkbox" class="select-item"></td>
                <td><?php echo $count; ?></td>
                <td><?php echo (isset($user['id'])) ? $user['id'] : '-' ?></td>
                <td><?php echo (isset($user['email'])) ? $user['email'] : '-' ?></td>
                <td><?php echo (isset($user['CartItem'])) ? count($user['CartItem']) : '-' ?></td>
                <td><?php echo (isset($user['updatedAt'])) ? (new DateTime($user['updatedAt']))->format('j F, Y - h:i a') : '-'; ?></td>

                <td>
                  <button class="btn btn-sm btn-primary view-cart send-email" data-cart-items="<?php echo htmlentities(json_encode($user['CartItem'])); ?>" data-email="<?php echo $user['email']; ?>">
                      <i class="fa fa-eye mr-2"></i> View Cart Items
                  </button>
                </td>
              </tr>

          <?php }
          } ?>

        </tbody>
      </table>

      <!-- Cart Items Modal -->
      <form action="send_email.php" method="post">
        <div class="modal fade" id="cartItemsModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">User Cart Items</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                          <div class="col-md-12">
                            <div class="cart-items-container p-3"></div>
                          </div>
                        </div>
                        <div class="row">
                          <div class="col-md-12">
                            <h4>Send Email</h4>
                          </div>
                        </div>
                        <div class="row">
                          <div class="col-md-12">
                            <div class="form-group">
                              <label for="subject">Subject</label>
                              <input type="text" class="form-control" name="subject" id="subject" placeholder="Subject" value="">
                            </div>
                          </div>
                          <div class="col-md-12">
                            <div class="form-group">
                                <label for="body">Body</label>
                                <textarea type="text" class="form-control" id="body" placeholder="Body" name="body" value="" rows="4"></textarea>
                            </div>
                          </div>
                        </div>
                        <input type="hidden" id="user_email" name="user_email" value="">
                        <button type="submit" class="btn btn-primary">Submit</button>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
      </form>

      <!-- Send Email Modal -->
      <form action="send_notification.php" method="post">
          <div class="modal fade" id="sendEmail" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
                  <div class="modal-content">
                      <div class="modal-header">
                          <h5 class="modal-title" id="exampleModalLabel">Send Email</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                          </button>
                      </div>
                      <div class="modal-body">
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
                          <input type="hidden" id="user_email" name="user_email" value="">
                      </div>
                      <div class="modal-footer">
                          <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                          <button type="submit" class="btn btn-primary">Submit</button>
                      </div>
                  </div>
              </div>
          </div>
      </form>

    <!-- Selected Emails Modal -->
    <div class="modal fade" id="selectedEmailsModal" tabindex="-1" role="dialog" aria-labelledby="selectedEmailsModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-lg" role="document">
        <div class="modal-content">
          <!-- Form starts here -->
          <form id="emailForm" method="post" action="user_emails_notification.php">
            <div class="modal-header">
              <h5 class="modal-title" id="selectedEmailsModalLabel">Selected User Emails</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
              <div class="table-responsive" style="max-height: 300px; overflow: auto;">
                <table class="table table-bordered sticky-header">
                  <thead class="thead-dark">
                    <tr>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody id="selectedEmailsTableBody">
                    <!-- Selected emails will be appended here -->
                  </tbody>
                </table>
              </div>
              <!-- Form fields -->
              <div class="form-group mt-3">
                <label for="subject">Subject</label>
                <input type="text" class="form-control" id="subject" aria-describedby="emailHelp" placeholder="Subject" name="subject" value="">
              </div>
              <div class="form-group">
                <label for="message">Message</label>
                <textarea class="form-control" name="message" id="message" placeholder="Message"></textarea>
              </div>
              <!-- Hidden input for storing selected emails -->
              <input type="hidden" id="user_emails" name="user_emails" value=""> 
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
              <button type="submit" class="btn btn-primary">Submit</button> <!-- Submit button -->
            </div>
          </form> <!-- Form ends here -->
        </div>
      </div>
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
    var table = $('#userTable').DataTable();
    var selectedEmails = []; // Array to store selected emails

    // Function to update the count of selected emails
    function updateSelectedEmailsCount() {
      $('#selectedEmailsCount').text(selectedEmails.length);
    }

    // Function to add email to the selected emails array
    function addEmail(email) {
      selectedEmails.push(email);
      updateEmailsInput(); // Update the hidden input field with selected emails
    }

    // Function to remove email from the selected emails array
    function removeEmail(email) {
      var index = selectedEmails.indexOf(email);
      if (index !== -1) {
        selectedEmails.splice(index, 1);
        updateEmailsInput(); // Update the hidden input field with selected emails
      }
    }

    // Update the hidden input field with selected emails as a comma-separated string
    function updateEmailsInput() {
      $('#user_email').val(selectedEmails.join(','));
    }

    // Select/Deselect all checkboxes
    $('#select-all').click(function() {
      var checked = this.checked;
      $('input.select-item').prop('checked', checked);
      if (checked) {
        table.rows().every(function() {
          var data = this.data();
          var email = data[3]; // Assuming the email is in the fourth column
          addEmail(email);
        });
      } else {
        selectedEmails = [];
        updateEmailsInput();
      }
      updateSelectedEmailsCount();
      displayEmailsInModal();
    });

    // Handle individual checkbox click
    $(document).on('click', 'input.select-item', function() {
      var row = $(this).closest('tr');
      var email = row.find('td:eq(3)').text().trim(); // Assuming the email is in the fourth column
      if (this.checked) {
        addEmail(email);
      } else {
        removeEmail(email);
      }
      updateSelectedEmailsCount();
      displayEmailsInModal();
    });

    // Function to get emails of all checked items on the current page
    function getCheckedData() {
      var selectedItems = [];
      $('input.select-item:checked').each(function() {
        var row = $(this).closest('tr');
        var email = row.find('td:eq(3)').text().trim(); // Ensure to trim whitespace
        selectedItems.push(email);
      });
      return selectedItems;
    }

    // Function to display selected emails in the modal table
    function displayEmailsInModal() {
      var $tableBody = $('#selectedEmailsTableBody');
      $tableBody.empty();
      if (selectedEmails.length > 0) {
        selectedEmails.forEach(function(email) {
          $tableBody.append('<tr><td>' + email + '</td></tr>');
        });
        // Set the selected emails to the hidden input
        $('#user_emails').val(selectedEmails.join(','));
      } else {
        $tableBody.append('<tr><td>No emails selected</td></tr>');
        // Clear the hidden input if no emails are selected
        $('#user_emails').val('');
      }
    }

    // Event listener for opening the modal
    $('#selectedEmailsModal').on('show.bs.modal', function() {
      displayEmailsInModal();
    });

      // Event listener for view cart button
      $(document).on('click', '.view-cart', function() {
        var email = $(this).data('email');
        $('#user_email').val(email);

        var cartItems = $(this).data('cart-items');
        console.log("User Cart Item: ", cartItems);
        var modalBody = $('.cart-items-container');
        modalBody.empty();
        if (cartItems && cartItems.length > 0) {
          var html = '<ul>';
          cartItems.forEach(function(item) {
            html += '<li>';
            html += 'Product ID: ' + item.id + ' , ';
            html += 'title: ' + item.title + ' , ';
            html += 'Quantity: ' + item.qty + ' , ';
            html += 'Category: ' + item.category + ' , ';
            html += 'Price: ' + item.content.price + ' , ';
            html += 'Cost: ' + item.content.cost + ' , ';
            html += 'isRecommended: ' + item.isRecommended + ' , ';
            html += 'off_percentage: ' + item.off_percentage + ' , ';
            html += 'country: ' + item.country;
            html += '</li>';
          });
          html += '</ul>';
          modalBody.html(html);
        } else {
          modalBody.html('<p>No items in the cart.</p>');
        }

        // Manually trigger the modal
        $('#cartItemsModal').modal('show');
      });

    });

    function logout() {
      window.location.href = "logout.php";
    }
    </script>

</body>

</html>