/** @jsx React.DOM */

function createCookie(name, value, days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = '; expires='+date.toGMTString();
	}
	else var expires = '';
	document.cookie = name+'='+value+expires+'; path=/';
}

function readCookie(name) {
	var nameEQ = name + '=';
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,'',-1);
}

marked = require('marked');
var renderer = new marked.Renderer();
renderer.codespan = function (html) {
	// Don't consider codespans in markdown (they're actually 'latex')
	return '`'+html+'`';
}
marked.setOptions({
	renderer: renderer
})

window.$ = require('jquery')
var Backbone = require('backbone')
var _ = require('underscore')
var React = require('react')

var Flasher = require('./flash.js')
Backbone.$ = window.$

var ProblemView = React.createClass({
	tryAnswer: function (e) {
		var index = parseInt(e.target.dataset.index);

		console.log("User clicked", index, this.props.model.get('apiPath')+'/try')

		$.ajax({
			type: 'post',
			dataType: 'json',
			url: this.props.model.get('apiPath')+'/try',
			data: { test: index }
		}).done(function (response) {
			if (response.error) {
				alert(response.message || 'Erro!');
			} else {
				if (response.result) {
					app.flash.info("Because you know me so well.");
				} else {
					app.flash.info("WROOOOOOOOOONNNG, YOU IMBECILE!");
				}
			}
		}).fail(function (xhr) {
			alert(xhr.responseJSON && xhr.responseJSON.message || 'Erro!');
		});
	},

	componentDidMount: function () {
		MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
	},

	render: function () {
		var post = this.props.model.attributes;

		var source = post.content.source;
		var isAdaptado = source && (!!source.match(/(^\[adaptado\])|(adaptado)/));

		var html = marked(post.content.body);

		var level = "3";
		var number = 5;
		var total = 10;

							// <img src={post.content.image} />
							// <span dangerouslySetInnerHTML={{__html: html}}></span>
		return (
			<div className="question-box">
				<header>
					<div className="breadcrumbs">
						Maratona OBM &raquo; Nível {post.level} &raquo; <a href={"/#"+post.topic}>#{post.translated_topic}</a>
					</div>
					<div className="right">
						Logado como <span className="username">{window.user.name}</span>,&nbsp;
						<a href="#" data-ajax-post-href="/api/me/logout" data-redirect-href="/">
							sair
						</a>
					</div>
				</header>
				<div className="content-col">
					<div className="body-window">
						<div className="content">
						<span>Na figura abaixo temos um pentágono regular, um quadrado e um triângulo equilátero, todos com a mesma medida de lado. Determine `_/_ _|_ root(3 22) ` a medida em graus do ângulo é `QCE`.</span>
							<img src="http://i.imgur.com/18SQrpS.png" />
						</div>
					</div>
					<div className="fixed-footer">
						<div className="info source">
							{source?source:null}
						</div>
						<div className="actions">
							<button className="info"><i className="icon-info"></i></button>
							<button className="flag"><i className="icon-flag"></i></button>
						</div>
					</div>
				</div>
				<div className="right-col">
					<span className="question">Qual é a resposta para o enunciado?</span>
					<input type="text" ref="answer" placeholder="Resultado" className="answer" name="answer"/>
					<button className="send">
						Responder
					</button>

					<button className="skip">
						Pular Problema
					</button>
				</div>
			</div>
		);
	},
});

// setTimeout(function updateCounters () {
// 	$('[data-time-count]').each(function () {
// 		this.innerHTML = calcTimeFrom(parseInt(this.dataset.timeCount), this.dataset.timeLong);
// 	});
// 	setTimeout(updateCounters, 1000);
// }, 1000);

var ProblemItem = Backbone.Model.extend({
	url: function () {
		return this.get('apiPath');
	},

	initialize: function () {
		var children = this.get('children') || [];
	},
});

var ProblemList = Backbone.Collection.extend({
	model: ProblemItem,
});
// Central functionality of the app.
var WorkspaceRouter = Backbone.Router.extend({
	initialize: function () {
		console.log('initialized')
	},

	flash: new Flasher,

	triggerComponent: function (comp, args) {
		comp.call(this, args);
	},

	routes: {
		'problems/:problemId':
			function (problemId) {
				this.triggerComponent(this.components.viewProblem,{id:problemId});
			},
	},

	components: {
		viewProblem: function (data) {
			var postId = data.id;
			$.getJSON('/api/problems/'+postId)
				.done(function (response) {
					var postItem = new ProblemItem(response.data);
					React.renderComponent(<ProblemView type="Problem" model={postItem} />,
						document.querySelector("#problem-wrapper"),
						function(){});
				}.bind(this))
				.fail(function (response) {
					alert('Ops! Não conseguimos encontrar esse problema. Ele pode ter sido excluído.');
				}.bind(this));
		},
	},
});

WorkspaceRouter

module.exports = {
	initialize: function () {
		new WorkspaceRouter;
		// Backbone.history.start({ pushState:false, hashChange:true });
		Backbone.history.start({ pushState:true, hashChange: false });
	},
};