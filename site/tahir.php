<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <div id="main">

    </div>


<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script>
  $(document).ready(function() {
  $.ajax({
    url: 'https://dummy.restapiexample.com/api/v1/employee/1',
    method: 'GET',
    datatype: 'json',

    success: function(response) {
      console.log(response);
      $('#main').append(response);
    },
    error: function(xhr, status, error) {
      
      console.log(error);
    }
  });
});


</script>
    
</body>
</html>