/**
 * This is an extension for annotation basic tour 
 */

 Object.assign(app_hotpot, {
    start_tour_annotation: function() {
        if (this.tour.annotation == null) {
            this.tour.annotation = new Shepherd.Tour({
                defaultStepOptions: {
                    classes: '',
                    scrollTo: true
                }
            });

            // add step for dtd
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'Welcome! 🎉 🎉 🎉  This tool is very easy to use!<br>First, we could drop a schema (.dtd) file here.<br>The schema file defines all of the concepts you want to annotate in the documents.',
                attachTo: {
                  element: '#dropzone_dtd',
                  on: 'right'
                },
                classes: '',
                buttons: [{
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }, {
                    text: 'Next <i class="fa fa-arrow-right"></i>',
                    action: this.tour.annotation.next
                }]
            });

            // add step for text
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'Second, you need to drop some annotation files here.<br>You could drop raw text files (.txt) to start and add more anytime. Our tool will automatically convert the text files to xml format when saving. Then, next time you could drop those saved xml files here directly.',
                attachTo: {
                  element: '#dropzone_ann',
                  on: 'right'
                },
                classes: '',
                buttons: [{
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }, {
                    text: '<i class="fa fa-arrow-left"></i> Prev',
                    action: this.tour.annotation.back
                }, {
                    text: 'Next <i class="fa fa-arrow-right"></i>',
                    action: this.tour.annotation.next
                }]
            });

            // add step for text
            this.tour.annotation.addStep({
                id: 'example-step',
                text: 'That\'s all to start a new annotation task!<br>If you are not sure what each button does, here is a sample dataset for you to try. You could play with this sample data freely to see how each function works for annotation.<br>Have fun! 😁',
                attachTo: {
                  element: '#btn_annotation_load_sample',
                  on: 'left'
                },
                classes: '',
                buttons: [{
                    text: '<i class="fa fa-arrow-left"></i> Prev',
                    action: this.tour.annotation.back
                }, {
                    text: 'Close',
                    classes: 'bg-gray', 
                    action: this.tour.annotation.complete
                }]
            });
        }

        this.tour.annotation.start();
    }
 });