import { Component, NgZone } from '@angular/core';
import { Platform } from 'ionic-angular';
import { NavController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';

import { Observable, BehaviorSubject } from 'rxjs';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	public pairingBarcode;

	private _scannerStatus: BehaviorSubject<string>;
	public scannerStatus: Observable<string>;

	public codes = [];

	constructor(
			public platform: Platform,
			public navCtrl: NavController,
			public zone: NgZone,
			public sanitizer: DomSanitizer
	) {
		this._scannerStatus = new BehaviorSubject<string>(undefined);
		this.scannerStatus = this._scannerStatus.asObservable();

		platform.ready().then(() => {
			window['cordova'].plugins.barcodescanner.attachHandlers((ev) => {
				// Plugin is out of sync with angular
				this.zone.run(() => {
					console.log(ev);
					if(ev.eventType == 'barcodeEvent') {
						if(ev.payload) {
							this.codes.push(ev.payload);
						}
					}
					if(ev.eventType == 'scannerPluggedIn') {
						window['cordova'].plugins.barcodescanner.connectToScanner((result) => { this.parseResult(result); });
					}
					if(ev.eventType == 'scannerUnplugged') {
						this._scannerStatus.next('disconnected');
					}
					if(ev.eventType == 'scannerConnected') {
						this._scannerStatus.next('connected');
					}
					if(ev.eventType == 'scannerDisconnected') {
						this._scannerStatus.next('disconnected');
						window['cordova'].plugins.barcodescanner.connectToScanner((result) => { this.parseResult(result); });
					}
				});
			});

			window['cordova'].plugins.barcodescanner.connectToScanner((result) => {
				console.log(result);
					this.parseResult(result);
			});
		});
	}

	private parseResult(result) {
		// Plugin out of sync with angular
		this.zone.run(() => {
			if(result.status === 'pairingRequired') {
				this._scannerStatus.next('pairingRequired');
				this.pairingBarcode = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/jpeg;base64,' + result.connectionBarcode);
			}
	
			if(result.status === 'paired') {
				this._scannerStatus.next('connected');
			}
		});
	}
}
