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
                id: 'tour-step1',
                text: 'Welcome! 🎉 🎉 🎉  MedTator is very easy to use!<br>First, you can drop a schema file here (.yaml/.json/.dtd) .<br>The schema file defines all of the concepts you want to annotate in the documents.',
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
                id: 'tour-step2',
                text: 'Second, you need to drop some annotation files here.<br>You can drop MedTator XML format files to start annotation. <br>MedTator can save your annotations in those xml files directly.<br>Moreover, you can also drop raw text files (.txt), <br>or use the <b><i class="fas fa-mortar-pestle"></i> Converter</b> Tab to convert .txt files to XML format.',
                attachTo: {
                  element: '#mui_filelist_list',
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
                id: 'tour-step3',
                text: "That's all to start a new annotation task!<br>If you are not sure what each button does, here are some sample datasets for you to try all the functions. You could play with the sample datasets freely to see how each function works.<br>Have fun! 😁 <br><br>And if you have any questions or issues, please feel free to <a target='_blank' href='https://github.com/OHNLP/MedTator/issues'>let us know</a>!",
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