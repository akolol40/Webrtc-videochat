$('button').on('click', function(e)  {
    localStorage.setItem('audio_input', $( "#audio_input option:selected" ).val())
    localStorage.setItem('video_input', $( "#video_input option:selected" ).val())
    window.location.href = `/call/${$('#room').val()}`
  })