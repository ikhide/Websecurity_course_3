$(document).ready(function () {
  $("#signin-form").submit(function (event) {
    event.preventDefault();
    $("#signin-username").removeClass("is-invalid");
    $("#signin-password").removeClass("is-invalid");
    const username = $("#signin-username").val();
    const password = $("#signin-password").val();

    $.post("/signin", { username, password }, function (data) {
      if (data) {
        location.reload();
      } else {
        $("#signin-username").addClass("is-invalid");
        $("#signin-password").addClass("is-invalid");
      }
    });
  });

  $("#signup-form").submit(function (event) {
    event.preventDefault();
    $("#signup-username").removeClass("is-invalid");
    $("#signup-password").removeClass("is-invalid");
    const username = $("#signup-username").val();
    const password = $("#signup-password").val();

    $.post("/signup", { username, password }, function (data) {
      if (data.success) {
        location.reload();
      } else {
        if (data.errorType === "username") {
          $("#signup-username").addClass("is-invalid");
        } else if (data.errorType === "password") {
          $("#signup-password").addClass("is-invalid");
        }
      }
    });
  });

  $("#signout-form").submit(function (event) {
    event.preventDefault();

    $.post("/signout", function (data) {
      if (data) {
        location.reload();
      }
    });
  });
});