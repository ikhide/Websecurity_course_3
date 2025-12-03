$(document).ready(function () {
  $("#signin-form").submit(function (event) {
    event.preventDefault();
    $("#signin-username").removeClass("is-invalid");
    $("#signin-password").removeClass("is-invalid");
    const username = $("#signin-username").val();
    const password = $("#signin-password").val();
    const csrfToken = $("#signin-form input[name='_csrf']").val();

    $.post(
      "/signin",
      { username, password, _csrf: csrfToken },
      function (data) {
        if (data.success) {
          location.reload();
        } else {
          $(".signin-error").text(data.message).show();
          $("#signin-username").addClass("is-invalid");
          $("#signin-password").addClass("is-invalid");
          if (data.csrfToken) {
            $("#signin-form input[name='_csrf']").val(data.csrfToken);
          }
        }
      }
    );
  });

  $("#signup-form").submit(function (event) {
    event.preventDefault();
    $("#signup-username").removeClass("is-invalid");
    $("#signup-password").removeClass("is-invalid");

    const username = $("#signup-username").val();
    const password = $("#signup-password").val();
    const csrfToken = $("#signup-form input[name='_csrf']").val();

    $.post(
      "/signup",
      { username, password, _csrf: csrfToken },
      function (data) {
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
          if (data.csrfToken) {
            $("#signup-form input[name='_csrf']").val(data.csrfToken);
          }
        }
      }
    );
  });

  $("#signout-form").submit(function (event) {
    event.preventDefault();
    const csrfToken = $("#signout-form input[name='_csrf']").val();

    $.post("/signout", { _csrf: csrfToken }, function (data) {
      if (data) {
        location.reload();
      }
    });
  });
});
