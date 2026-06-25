package com.vetclinic.petowner.data.remote

import android.content.Context
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl

/**
 * PHP backend authenticates via $_SESSION cookies (HttpOnly, Secure, SameSite=Lax
 * per the project's README). OkHttp does not persist cookies between requests by
 * default, so every call would otherwise look logged-out. This jar keeps cookies
 * in memory per-host and mirrors the session id into SharedPreferences so a
 * relaunch of the app doesn't immediately force a re-login screen flash.
 */
class PersistentCookieJar(context: Context) : CookieJar {

    private val prefs = context.applicationContext
        .getSharedPreferences("vet_clinic_cookies", Context.MODE_PRIVATE)

    private val cookieStore = mutableMapOf<String, MutableList<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        if (cookies.isEmpty()) return
        cookieStore[url.host] = cookies.toMutableList()
        cookies.firstOrNull { it.name == "PHPSESSID" }?.let {
            prefs.edit().putString("session_value", it.value).apply()
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return cookieStore[url.host] ?: emptyList()
    }

    fun hasSession(): Boolean = prefs.contains("session_value")

    fun clear() {
        cookieStore.clear()
        prefs.edit().clear().apply()
    }
}
