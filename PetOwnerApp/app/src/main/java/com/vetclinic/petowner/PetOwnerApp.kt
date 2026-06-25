package com.vetclinic.petowner

import android.app.Application
import com.vetclinic.petowner.data.remote.RetrofitClient

class PetOwnerApp : Application() {
    override fun onCreate() {
        super.onCreate()
        // Must run before any screen touches RetrofitClient.api
        RetrofitClient.init(this)
    }
}
