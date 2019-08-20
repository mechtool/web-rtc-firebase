import {Inject, Injectable} from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
@Injectable()
export class PwaService {
    constructor(@Inject(SwUpdate) public swUpdate: SwUpdate) {
	this.swUpdate.available.subscribe(event => {
	    if (this.askUserToUpdate()) {
		window.location.reload();
	    }
	});
    }
    askUserToUpdate(){
        return true;
    }
}
