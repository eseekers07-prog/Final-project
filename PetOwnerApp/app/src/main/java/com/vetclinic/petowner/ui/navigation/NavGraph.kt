package com.vetclinic.petowner.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.foundation.layout.padding
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.vetclinic.petowner.ui.auth.SessionViewModel
import com.vetclinic.petowner.ui.booking.BookingFlowScreen
import com.vetclinic.petowner.ui.home.HomeScreen
import com.vetclinic.petowner.ui.pets.PetsListScreen
import com.vetclinic.petowner.ui.profile.ProfileScreen
import com.vetclinic.petowner.ui.records.MedicalTimelineScreen

sealed class Screen(val route: String, val label: String, val icon: ImageVector) {
    object Home : Screen("home", "Home", Icons.Default.Home)
    object Pets : Screen("pets", "My Pets", Icons.Default.Pets)
    object Book : Screen("book", "Book", Icons.Default.CalendarMonth)
    object Records : Screen("records", "Records", Icons.Default.MedicalServices)
    object Profile : Screen("profile", "Profile", Icons.Default.Person)
}

private val bottomNavItems = listOf(Screen.Home, Screen.Pets, Screen.Book, Screen.Records, Screen.Profile)

@Composable
fun PetOwnerNavHost(sessionViewModel: SessionViewModel, onLoggedOut: () -> Unit) {
    val navController = rememberNavController()
    val ownerName = sessionViewModel.state.value.ownerEmail?.substringBefore("@") ?: "Pet Owner"

    Scaffold(
        bottomBar = {
            NavigationBar {
                val currentRoute = navController.currentBackStackEntryAsState().value
                    ?.destination?.route
                bottomNavItems.forEach { screen ->
                    NavigationBarItem(
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                launchSingleTop = true
                            }
                        },
                        icon = { Icon(screen.icon, contentDescription = screen.label) },
                        label = { Text(screen.label) }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController,
            startDestination = Screen.Home.route,
            modifier = Modifier.padding(padding)
        ) {
            composable(Screen.Home.route) { HomeScreen(ownerName = ownerName) }
            composable(Screen.Pets.route) {
                PetsListScreen(
                    onViewHistory = { navController.navigate(Screen.Records.route) },
                    onBookVisit = { navController.navigate(Screen.Book.route) }
                )
            }
            composable(Screen.Book.route) {
                BookingFlowScreen(onBookingComplete = { navController.navigate(Screen.Home.route) })
            }
            composable(Screen.Records.route) { MedicalTimelineScreen() }
            composable(Screen.Profile.route) {
                ProfileScreen(sessionViewModel = sessionViewModel, onLoggedOut = onLoggedOut)
            }
        }
    }
}
