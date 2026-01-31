<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'admin_si',
                'display_name' => 'Administrateur SI',
                'description' => 'Super administrateur du système',
                'permissions' => [
                    'manage_users',
                    'manage_roles',
                    'manage_dictionaries',
                    'view_audit_logs',
                    'access_admin_dashboard',
                    'activate_users',
                    'assign_roles',
                    'reset_passwords',
                ],
                'is_active' => true,
            ],
            [
                'name' => 'reception',
                'display_name' => 'reception',
                'description' => '',
                
                'is_active' => true,
            ],
            [
                'name' => 'responsable_uas',
                'display_name' => 'responsable_uas',
                'description' => '',
                'permissions' => [
                    'view_dossiers',
                ],
                'is_active' => true,
            ],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                ['name' => $role['name']],
                $role
            );
        }
    }
}