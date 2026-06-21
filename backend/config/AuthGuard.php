<?php
declare(strict_types=1);

namespace App\Config;

require_once __DIR__ . '/db.php';

final class AuthGuard
{
    public static function checkAuth(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
            self::deny(401, 'Unauthorized');
        }

        return [
            'user_id' => (int) $_SESSION['user_id'],
            'role' => (string) $_SESSION['role'],
            'email' => (string) ($_SESSION['email'] ?? ''),
            'username' => (string) ($_SESSION['username'] ?? ''),
        ];
    }

    public static function checkRole(string $requiredRole): array
    {
        $auth = self::checkAuth();

        if ($auth['role'] !== $requiredRole) {
            self::deny(403, 'Forbidden');
        }

        return $auth;
    }

    public static function checkRoles(array $allowedRoles): array
    {
        $auth = self::checkAuth();

        if (!in_array($auth['role'], $allowedRoles, true)) {
            self::deny(403, 'Forbidden');
        }

        return $auth;
    }

    private static function deny(int $status, string $message): void
    {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => $message]);
        exit;
    }
}
