$(document).ready(function(){
$('i').click(function(){
var id=$('i[data-id]').attr('data-id');
var icon_action=$('i').hasClass('active');
if(icon_action === false){
var url='/add/favorites/'+id;
$.ajax(url,{
  success:function(data){
  var isFavorit=data.isFavorite;
// var prefrOrder=data.idPrefr
console.log(isFavorit);
$('i').addClass('active');
}
});
}else{
  var url='/remove/favorites/'+id;
$.ajax(url,{
  success:function(data){
    var isFavorit=data.isFavorite;
    console.log(isFavorit);
    $('i').removeClass('active');
}
});
}

});
});