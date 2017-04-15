$(function() {
  // Your custom JavaScript goes here
  var formData = JSON.parse($('#org-survey').val());

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
});