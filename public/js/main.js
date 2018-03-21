$(function() {
  // Your custom JavaScript goes here
  var formData = "";
  if($('#org-survey').val() != undefined) {
    if($('#org-survey').val().length) {
      formData = JSON.parse($('#org-survey').val());
    }

    var options = {
      disableFields: [
        'autocomplete',
        'file',
        'date',
        'checkbox-group',
        'button',
        'hidden',
        'radio-group'
      ],
      dataType: 'json',
      showActionButtons: false,
      formData: formData
    };

    var formBuilder = $('.build-wrap').formBuilder(options);

    $('.btn-org-save').click(function(e) {
      e.preventDefault();
      $('#org-survey').val(JSON.stringify(formBuilder.formData));
      $('.build-wrap').remove();
      $('form').submit();
    });

  } else if($('#fbTemplate').val()) {
    var fbTemplate = document.getElementById('fbTemplate').value;
    var parsed = JSON.parse(fbTemplate);

    var renderDefaults = {
      container: false,
      formData: parsed,
      dataType: 'json',
      render: true
    }

    var formRender = $('.render-form').formRender(renderDefaults);
    $('.btn-app-save').click(function(e) {
      e.preventDefault();
      var elements = $('.form-control');
      var responses = [];

      for(var i = 0; i < elements.length; i++) {
        var response = {};
        response.question = $(elements[i]).prev().text()

        if(!($(elements[i]).is('select'))) {
          response.answer = $(elements[i]).val();
        } else {
          response.answer = $(elements[i]).find('option:selected').text();
        }
        responses.push(response);
      }

      $('#surveyResponses').val(JSON.stringify(responses));
      $('form').submit();
    });
  }

});
