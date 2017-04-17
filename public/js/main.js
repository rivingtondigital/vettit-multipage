$(function() {
  // Your custom JavaScript goes here
  var formData = "";
  if($('#org-survey').val()) {
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
        'hidden'
      ],
      dataType: 'json',
      showActionButtons: false,
      formData: formData
    };

    var formBuilder = $('.build-wrap').formBuilder(options).data('formBuilder');
    $('.btn-org-save').click(function(e) {
      e.preventDefault();
      $('#org-survey').val(JSON.stringify(formBuilder.formData));
      $('.build-wrap').remove();
      $('form').submit();
    });
  } else if($('#fbTemplate').val()) {
    var fbTemplate = document.getElementById('fb-template');
    var formRender = $('.render-form').formRender({formData: fbTemplate.value});
  }

});
