var parseTags = function(tagsString) {
    var split = tagsString.toLowerCase().split(',');
    return split.filter(function(val) {
        return val.length > 1;
    });
};

var createNoteObject = function(template) {
    var title = template.find('#note-title').value || "";
    var tags = template.find('#note-tags').value || "";
    var content = template.find('#note-content').value || "";

    return {
        "title": title,
        "tags": parseTags(tags),
        "content": content,
        "date_created": new Date().getTime()
    };
};

var validateNote = function(note) {
    return note.title && note.tags && note.tags.length > 0 && note.content;
};

var updatePreviewNote = function() {
    var that = this;
    return _.debounce(function(event, t) {
        t = t || that;
        var note = createNoteObject(t);
        Object.keys(note).forEach(function(what) {
            Session.set(what, note[what]);
        });
        Session.set("previewNoteUpdated", Math.random());
    }, 350);
};

var inputValidationFeedback = function(t) {
    var validateNode = function(node) {
        if (!node.value) {
            $(node).addClass('required');
        } else {
            $(node).removeClass('required');
        }
    };
    [t.find('#note-title'), t.find('#note-tags'), t.find('#note-content')].forEach(validateNode);
};

var cleanupSubmit = function(t) {
    var clean = function (node) {
        $(node).removeClass('required');
        node.value = '';
    };

    [
        t.find('#note-title'),
        t.find('#note-tags'),
        t.find('#note-content')
    ].forEach(clean);

    [
        "content",
        "title",
        "tags",
        "editingNote"
    ].forEach(function (key) {
        Session.set(key, "");
    });
};

var submitTags = function(tags) {
    _.each(tags, function(tag) {
        if (!Tags.findOne({
            name: tag
        })) Tags.insert({
            name: tag
        });
    });
};

Template.editor.rendered = function() {
    var that = this;
    this.autorun(function() {
        if (Session.get('editingNote')) {
            that.find('#note-tags').value = Session.get('tags');
            that.find('#note-content').value = Session.get('content');
            that.find('#note-title').value = Session.get('title');
        }
    });
};

Template.editor.events({
    'click #newNoteBtn': function(event, t) {
        var note = createNoteObject(t);
        inputValidationFeedback(t);
        if (validateNote(note)) {
            submitTags(note.tags);
            Notes.insert(note);
            cleanupSubmit(t);
        }
    },
    'click #updateNoteBtn': function(event, t) {
        var note = createNoteObject(t);
        inputValidationFeedback(t);
        if (validateNote(note)) {
            submitTags(note.tags);
            Notes.update({
                _id: Session.get('editingNote')
            }, {
                $set: note
            });
            cleanupSubmit(t);
        }
    },
    'keyup textarea': updatePreviewNote(),
    'keyup #note-title': updatePreviewNote(),
    'keyup #note-tags': updatePreviewNote(),
});

Template.editor.newNoteMode = function() {
    return Session.equals('noteMode', 'new');
};

Template.editor.updateNoteMode = function() {
    return Session.equals('noteMode', 'update');
};

Template.editor.notify = function() {
    return Session.equals("newNoteNotify", true) ? "animated bounce" : "";
};