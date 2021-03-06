'use strict';

// Convenience functions
function updateMediaListDropdown(){
  let select = $('.image-slider-template-list-tail select')
  select.html('<option value=""></option>');
  for(let key in vueEditorData.mediaItems){
    let mediaItem = vueEditorData.mediaItems[key];
    select.append(`<option value="${mediaItem.url}">${mediaItem.name}</option>`);
  }
}

function addImageSliderTemplateListItem(url){
  let cloneable = $('.image-slider-template-list-tail').html();
  $('.image-slider-template-list-tail').before(`<li class="image-slider-template-list-item">${cloneable}</li>`);
  $('.image-slider-template-list-item:last select').val(url);
}

// Read changes and inject into form
updateMediaListDropdown();
(display['items'] || []).forEach(addImageSliderTemplateListItem);
$('#display-clock').val(display['clock']);
$('#display-delay').val(display['delay']);

// Write changes to return-json data store
window.rawTemplateWriteDataChanges = ()=>{
  // parse image list
  let value = $(this).val();
  let isTail = $(this).closest('li').hasClass('image-slider-template-list-tail');
  if(isTail && (value != '')){
    addImageSliderTemplateListItem(value);
    updateMediaListDropdown();
  } else if (!isTail && (value == '')) {
    $(this).closest('li').remove();
  }
  let items = $('.image-slider-template-list-item select').map(function(){ return $(this).val(); }).toArray();
  // write to data store
  $('#selected-display-form').data('return-json', {
    items: items,
    delay: $('#display-delay').val(),
    clock: $('#display-clock').val()
  });
}

// Update list and write changes to return-json data store on change
$('.image-slider-template-list').on('change', 'select', window.rawTemplateWriteDataChanges);
$('#display-delay, #display-clock').on('change keyup click', window.rawTemplateWriteDataChanges);

// Update and write now
window.rawTemplateWriteDataChanges();
