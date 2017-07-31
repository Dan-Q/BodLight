'use strict';

(()=>{
  // Read changes and inject into form
  $('#display-html').val(display['html']);
  $('#display-js').val(display['js']);

  // Write changes to return-json data store
  window.rawTemplateWriteDataChanges = ()=>{
    $('#selected-display-form').data('return-json', {
      html: $('#display-html').val(),
      js: $('#display-js').val()
    });
  }
  window.rawTemplateWriteDataChanges();

  // Syntax highlighting
  const displayHtmlEditor = CodeMirror.fromTextArea($('#display-html')[0], { lineNumbers: true, mode: 'htmlmixed' });
  displayHtmlEditor.on('change', (instance, changes)=>{
    $('#display-html').val(instance.getValue());
    window.rawTemplateWriteDataChanges();
  });
  const displayJsEditor   = CodeMirror.fromTextArea($('#display-js')[0], { lineNumbers: true, mode: 'javascript' });
  displayJsEditor.on('change', (instance, changes)=>{
    $('#display-js').val(instance.getValue());
    window.rawTemplateWriteDataChanges();
  });
})();
