package com.vetclinic.petowner.data.remote

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object RetrofitClient {

    // TODO: point this at your real server before building a release APK.
    // Use 10.0.2.2 instead of localhost when testing against a local PHP
    // server from the Android emulator.
    private const val BASE_URL = "https://your-vet-clinic-domain.com/"

    private lateinit var cookieJar: PersistentCookieJar
    private var initialized = false

    fun init(context: Context) {
        if (initialized) return
        cookieJar = PersistentCookieJar(context)
        initialized = true
    }

    fun hasSession(): Boolean = if (initialized) cookieJar.hasSession() else false
    fun clearSession() { if (initialized) cookieJar.clear() }

    val api: ApiService by lazy {
        require(initialized) { "RetrofitClient.init(context) must be called before use (see PetOwnerApp.onCreate)" }

        val logging = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val client = OkHttpClient.Builder()
            .cookieJar(cookieJar)
            .addInterceptor(logging)
            .build()

        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }
}
