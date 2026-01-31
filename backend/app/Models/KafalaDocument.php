<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class KafalaDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'kafala_id',
        'nom_fichier',
        'chemin_fichier',
        'type_mime',
        'taille',
    ];

    public function kafala()
    {
        return $this->belongsTo(Kafala::class);
    }
}