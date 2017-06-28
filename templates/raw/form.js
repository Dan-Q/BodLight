'use strict';

$('#display-html').val(display['html']);
$('#display-js').val(display['js']);

$('#display-html, #display-js').on('change', ()=>{
  $('#selected-display-form').data('return-json', {
    html: $('#display-html').val(),
    js: $('#display-js').val()
  });
  console.log($('#selected-display-form').data('return-json'));
}).first().trigger('change');
