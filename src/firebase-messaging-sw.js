self.importScripts('ngsw-worker.js');
self.importScripts("https://www.gstatic.com/firebasejs/6.2.4/firebase-app.js");
self.importScripts("https://www.gstatic.com/firebasejs/6.2.4/firebase-messaging.js");

firebase.initializeApp({
	apiKey: "AIzaSyCGXsyNI44iOrywQnMBj-HzLBJv6lvjIQ0",
	authDomain: "web-rtc-firebase-bd8fe.firebaseapp.com",
	databaseURL: "https://web-rtc-firebase-bd8fe.firebaseio.com",
	projectId: "web-rtc-firebase-bd8fe",
	storageBucket: "",
	messagingSenderId: "754282901250",
	appId: "1:754282901250:web:032c8eb7c4febb41"
}) ;

var messaging = firebase.messaging();

/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.
 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/4.8.1/firebase-messaging.js');
 // Initialize the Firebase app in the service worker by passing in the
 // messagingSenderId.
 firebase.initializeApp({
   'messagingSenderId': 'YOUR-SENDER-ID'
 });
 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();
 // [END initialize_firebase_in_sw]
 **/

/*
*
* navigator.serviceWorker.register('./your-serviceworker-file.js')
.then((registration) => {
 messaging.useServiceWorker(registration);

 // Request permission and get token.....
});
* */
// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
let icons = {
	text : 'https://firebasestorage.googleapis.com/v0/b/web-rtc-pwa.appspot.com/o/icons%2Foutline_message_black_18dp.png?alt=media&token=8de5f1b2-b732-43e7-a197-00d1220d9453',
	audio : 'https://firebasestorage.googleapis.com/v0/b/web-rtc-pwa.appspot.com/o/icons%2Foutline_sms_black_18dp.png?alt=media&token=a627502f-ba0e-4520-91a7-622aaabf33a0',
	video :'https://firebasestorage.googleapis.com/v0/b/web-rtc-pwa.appspot.com/o/icons%2Foutline_voice_chat_black_18dp.png?alt=media&token=05c97412-153b-4656-8d15-c6787f884f92'} ;
//Обработка нажатия и закрытия сообщения
self.addEventListener('notificationclick', onClickNotification);
self.addEventListener('notificationclose', onCloseNotification);
//Обработка входящих уведомлений в случае, когда приложение закрыто или вне фокуса
messaging.setBackgroundMessageHandler(function(payload) {
	console.log('[firebase-messaging-sw.js] Получено сообщение с сервера');
	// Здесь идет настройка сообщения
	var notificationTitle = 'Новое сообщение.';
//	var sender = JSON.parse(payload.data.sender);
	var notificationOptions = {
/*		body: 'Входящее сообщение от '+ (sender.name || sender.displayName || sender.email || sender.phoneNumber),
		icon: icons[payload.data.messageType],*/
		actions: [
			{action: 'receive', title: 'Принять'},
			{action: 'reject', title: 'Пропустить'}]
	};
	
	return self.registration.showNotification(notificationTitle, notificationOptions);
});

function onClickNotification(event) {
	if (event.action === 'receive') {
		self.clients.openWindow('https://web-rtc-firebase-bd8fe.firebaseapp.com/');
	}
	onCloseNotification(event);
}
function onCloseNotification(event){
	console.log('OnClose') ;
	event.notification.close();
}

// [END background_handler]

/*
var cacheName = 'web-rtc-cache';
var filesToCache = ['/'];//файлы оболочки приложения
//при установки сервисного рабочего заполняем кэш
//importScripts('/cache-polyfill.js');

self.addEventListener('install', function(evt) {
	console.log('[ServiceWorker] Сервисный рабочий установлен! Запуск предварительного кэширования...');
	//Предварительное кэширование ресурсов
	evt.waitUntil(precache());
});

self.addEventListener('activate', function(e) {
	console.log('[ServiceWorker] Сервисный рабочий активирован!');
	e.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== cacheName) {
					console.log('[ServiceWorker] Удаление старых кэшей!', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', function(evt) {
	console.log('Перехват запроса клиентов.');
	//Сначала выдаем из кэша
	evt.respondWith(fromCache(evt.request));
	//Затем обновляем ресурс в кэше новым результатом запроса на сервер
	evt.waitUntil(update(evt.request));
});

function precache() {
	return caches.open(cacheName).then(function (cache) {
		//автоматическая загрузка всех файлов-клиентов (файлов, находящихся в одной папке с файлом сервисного рабочего, для настройки
		// путей файлов кэширования на корень сайта '/')
		return cache.addAll(filesToCache);
	});
}
//получение данных из кэша
function fromCache(request) {
	return caches.open(cacheName).then(function (cache) {
		return cache.match(request).then(function (matching) {
			return matching || Promise.reject('no-match');
		});
	});
}
 //Обновление кэша результатом с сервера
function update(request) {
	return caches.open(cacheName).then(function (cache) {
		return fetch(request).then(function (response) {
			return cache.put(request, response);
		});
	});
}
*/

