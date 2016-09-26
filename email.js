/**
 * @author Fredrik Blomqvist
 */
define(['jquery', 'MochiKit/Text'], function($) {

// namespace
var mail = {};

/**
 * create a "mailto:" url.
 * Typically put in the href of an <a> tag. Will typically open your mail-app when clicked.
 *
 * input either string or { email: string, cc: string: bcc: string, subject: string, body: string } all fields optional.
 * (doesn't validate the email format).
 * todo: hmm, tel: skype: etc might be similar I guess?
 *
 * todo: would "attachment" work? (not standard?)
 * 
 * @param {string|{email: string=, cc: string=, bcc: string=, subject: string=, body: string=}} email  multiple mails can be comma separated. all fields are optional.
 * @param {string=} [subject]
 * @param {string=} [body] can include newlines (multiple blank newlines seems to collapse to just one in at least my mail prog)
 * @return {string}
 */
mail.createEmailUrl = function(email, subject, body) {
	// handle overloading
	var arg = null;
	if (arguments.length == 1 && typeof arguments[0] == 'object') {
		arg = $.extend({}, arguments[0]); // clone so we don't modify input
	} else {
		arg = {
			email: email,
			subject: subject,
			body: body
		};
	}

	// remove possible space between comma separated mails
	if (arg.email) arg.email = arg.email.replace(/\s/g, '');
	if (arg.cc) arg.cc = arg.cc.replace(/\s/g, '');
	if (arg.bcc) arg.bcc = arg.bcc.replace(/\s/g, '');

	// encode subject and body, whitespace to %20 etc
	if (arg.subject) arg.subject = encodeURIComponent(arg.subject);
	// newlines in body -> %0A (or even %0D%0A ?)
	if (arg.body) arg.body = encodeURIComponent(arg.body.replace(/'\n'/g, '%0A'));

	// create a format string (doing it in one step with empty placeholders kindof works but clutters the url so much)
	// add mail last thing (see below)
	// (we Don't use $.param() or MK.queryString() since we care about the ordering (array versions could work but then special cases anyway. And encoding))
	var template = format('{cc}{bcc}{subject}{body}', {
		cc: arg.cc ? '&cc={cc}' : '',
		bcc: arg.bcc ? '&bcc={bcc}' : '',
		subject: arg.subject ? '&subject={subject}' : '',
		body: arg.body ? '&body={body}' : ''
	});

	if (template.charAt(0) == '&') {
		template = '?' + template.substr(1);
	}
	if (arg.email) {
		template = '{email}' + template;
	}

	var url = 'mailto:' + format(template, arg);
	return url;
};


return mail;

});
