'use strict';

// Write changes to return-json data store
window.rawTemplateWriteDataChanges = ()=>{
  let pages = $('.bottom-menu-template-form-pages tbody tr').map(function(){
    return {
      name: $(this).find('.page-name').val(),
      content: $(this).find('.page-content').val()
    };
  }).toArray();
  // write to data store
  $('#selected-display-form').data('return-json', {
    pages: pages
  });
}

// add new page
$('#bottom-menu-template-form-add-page').on('click', ()=>{
  $('.bottom-menu-template-form-pages tbody').append(`
    <tr>
      <td>
        <input type="text" class="page-name form-control" />
      </td>
      <td>
        <textarea class="page-content"></textarea>
      </td>
      <td>
        <button class="btn btn-default bottom-menu-template-form-up-page">⬆️</button>
        <button class="btn btn-default bottom-menu-template-form-down-page">⬇️</button>
        <button class="btn btn-warning bottom-menu-template-form-delete-page">Delete</button>
      </td>
    </tr>
  `);
  const contentTextarea = $('.bottom-menu-template-form-pages tbody tr:last .page-content');
  const contentEditor = CodeMirror.fromTextArea($('.bottom-menu-template-form-pages tbody tr:last .page-content')[0], { lineNumbers: true, mode: 'htmlmixed' });
  contentTextarea.data('codemirror', contentEditor);
  contentEditor.on('change', (instance, changes)=>{
    contentTextarea.val(instance.getValue());
    window.rawTemplateWriteDataChanges();
  });
});

// remove a page
$('.bottom-menu-template-form-pages').on('click', '.bottom-menu-template-form-delete-page', function(){
  $(this).closest('tr').remove();
});

// move up/down a page
$('.bottom-menu-template-form-pages').on('click', '.bottom-menu-template-form-up-page', function(){
  const row = $(this).closest('tr');
  $(row).prev().before(row);
});
$('.bottom-menu-template-form-pages').on('click', '.bottom-menu-template-form-down-page', function(){
  const row = $(this).closest('tr');
  $(row).next().after(row);
});

// Read changes and inject into form
(display['pages'] || []).forEach((page)=>{
  $('#bottom-menu-template-form-add-page').trigger('click');
  const lastTr = $('.bottom-menu-template-form-pages tbody tr:last');
  lastTr.find('.page-name').val(page.name);
  lastTr.find('.page-content').val(page.content).data('codemirror').setValue(page.content);
});

// Update and write now
window.rawTemplateWriteDataChanges();
