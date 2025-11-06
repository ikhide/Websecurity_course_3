$(document).ready(function () {
  $("#signin-form").submit(function (event) {
    event.preventDefault();
    $("#signin-username").removeClass("is-invalid");
    $("#signin-password").removeClass("is-invalid");
    const username = $("#signin-username").val();
    const password = $("#signin-password").val();

    $.post("/signin", { username, password }, function (data) {
      if (data.success) {
        location.reload();
      } else {
        $(".signin-error").text(data.message).show();
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
          $(".invalid-feedback-username").text(data.message).show();
        } else if (data.errorType === "password") {
          $("#signup-password").addClass("is-invalid");
          $(".invalid-feedback-password").text(data.message).show();
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
