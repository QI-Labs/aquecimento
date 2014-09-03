
module.exports = function () {
	$("[data-action=edit-profile]").click(function () {
		$(".profileWrapper").addClass('editing');
	});
	$("[name=name1], [name=name2]").on('keydown', function (e) {
		if (e.keyCode == 32) {
			e.preventDefault();
		}
	});
	$('.autosize').autosize();
	$("[data-action=save-profile]").click(function () {
		var profile = {
			bio: $("[name=bio]").val(),
			nome1: $("[name=name1]").val(),
			nome2: $("[name=name2]").val(),
			home: $("[name=home]").val(),
			location: $("[name=location]").val(),
		};

		$.ajax({
			type: 'PUT',
			dataType: 'JSON',
			url: '/api/me/profile',
			data: {
				profile: profile
			}
		}).done(function (response) {
			if (response.error) {
				if (response.message) {
					app.flash.alert(response.message);
				} else {
					console.warn('????',response);
				}
			} else if (response.data) {
				var me = response.data;
				$(".profileWrapper").removeClass('editing');
				$(".profileOutput.bio").html(me.profile.bio);
				$(".profileOutput.name").html(me.name);
				$(".profileOutput.home").html(me.profile.home);
				$(".profileOutput.location").html(me.profile.location);
			} else {
				app.flash.alert("Um erro pode ter ocorrido.");
			}
		}).fail(function () {
		});
	})
};