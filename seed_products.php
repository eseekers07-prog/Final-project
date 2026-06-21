#!/usr/bin/env php
<?php
declare(strict_types=1);

require_once __DIR__ . '/backend/config/db.php';

use App\Config\Database;

$pdo = Database::getConnection();

$products = [
    [
        'product_name' => 'NexGard Spectra Dog Chew',
        'manufacturer' => 'Boehringer Ingelheim',
        'batch_number' => 'NGD-2026-01',
        'expiry_date' => '2027-08-31',
        'stock_quantity' => 24,
        'description' => 'Monthly chewable parasite protection for dogs. Confirm pet weight before purchase.',
        'price' => 3850.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Royal Canin Mini Adult',
        'manufacturer' => 'Royal Canin',
        'batch_number' => 'RCM-2026-04',
        'expiry_date' => '2027-05-30',
        'stock_quantity' => 18,
        'description' => 'Complete dry food for small adult dogs with balanced nutrition.',
        'price' => 7200.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Virbac Epi-Otic Ear Cleanser',
        'manufacturer' => 'Virbac',
        'batch_number' => 'VIR-EO-112',
        'expiry_date' => '2027-03-15',
        'stock_quantity' => 30,
        'description' => 'Gentle ear cleanser for dogs and cats. Use as directed by the clinic.',
        'price' => 2950.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Feline Premium Clumping Litter',
        'manufacturer' => 'CleanPaws',
        'batch_number' => 'CPL-775',
        'expiry_date' => null,
        'stock_quantity' => 40,
        'description' => 'Low-dust clumping litter for indoor cats with odor control.',
        'price' => 2450.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'PetDerm Oatmeal Shampoo',
        'manufacturer' => 'PetDerm Labs',
        'batch_number' => 'PDO-2026-09',
        'expiry_date' => '2028-01-10',
        'stock_quantity' => 22,
        'description' => 'Soothing oatmeal shampoo for sensitive skin and routine coat care.',
        'price' => 1850.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Rabies Vaccine Dose',
        'manufacturer' => 'Clinic Vaccine Stock',
        'batch_number' => 'RAB-CL-2606',
        'expiry_date' => '2027-02-28',
        'stock_quantity' => 35,
        'description' => 'Clinic-administered rabies vaccine dose. Appointment confirmation required.',
        'price' => 3200.00,
        'requires_prescription' => 1,
        'delivery_available' => 0,
        'photo_url' => 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Whiskas Ocean Fish Adult Cat Food',
        'manufacturer' => 'Whiskas',
        'batch_number' => 'WHK-OF-0626',
        'expiry_date' => '2027-11-20',
        'stock_quantity' => 28,
        'description' => 'Balanced dry food for adult cats with fish flavor and daily nutrition support.',
        'price' => 3650.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Bayer Drontal Plus Dewormer',
        'manufacturer' => 'Bayer',
        'batch_number' => 'DRP-2026-18',
        'expiry_date' => '2028-04-15',
        'stock_quantity' => 16,
        'description' => 'Broad-spectrum deworming tablets for dogs. Dose should match pet weight.',
        'price' => 2750.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Frontline Plus Flea & Tick Spray',
        'manufacturer' => 'Frontline',
        'batch_number' => 'FLP-SP-410',
        'expiry_date' => '2027-09-05',
        'stock_quantity' => 20,
        'description' => 'Topical flea and tick control spray for dogs and cats. Follow clinic guidance.',
        'price' => 4950.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758123927-196a9798e407?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'PetSafe Adjustable Collar',
        'manufacturer' => 'PetSafe',
        'batch_number' => 'PSC-ADJ-26',
        'expiry_date' => null,
        'stock_quantity' => 32,
        'description' => 'Soft adjustable everyday collar with secure buckle for small and medium pets.',
        'price' => 1450.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Hill\'s Science Diet Puppy Starter',
        'manufacturer' => 'Hill\'s Pet Nutrition',
        'batch_number' => 'HSD-PUP-0626',
        'expiry_date' => '2027-12-31',
        'stock_quantity' => 14,
        'description' => 'Starter nutrition for puppies with digestible ingredients and growth support.',
        'price' => 8400.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Clinic Wound Care Antiseptic Spray',
        'manufacturer' => 'VetCare Labs',
        'batch_number' => 'VCL-WCS-92',
        'expiry_date' => '2028-02-28',
        'stock_quantity' => 26,
        'description' => 'Antiseptic wound care spray for minor skin cleaning under clinic advice.',
        'price' => 2250.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Canine DHPPi Vaccine Dose',
        'manufacturer' => 'Clinic Vaccine Stock',
        'batch_number' => 'DHPPI-CL-2607',
        'expiry_date' => '2027-07-31',
        'stock_quantity' => 42,
        'description' => 'Clinic-administered core vaccine dose for dogs. Appointment confirmation required.',
        'price' => 3800.00,
        'requires_prescription' => 1,
        'delivery_available' => 0,
        'photo_url' => 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Feline Tricat Vaccine Dose',
        'manufacturer' => 'Clinic Vaccine Stock',
        'batch_number' => 'TRICAT-CL-2608',
        'expiry_date' => '2027-08-31',
        'stock_quantity' => 38,
        'description' => 'Clinic-administered vaccine dose for cats. Vet appointment required.',
        'price' => 3600.00,
        'requires_prescription' => 1,
        'delivery_available' => 0,
        'photo_url' => 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Ivermectin Injection',
        'manufacturer' => 'VetCare Pharma',
        'batch_number' => 'IVM-INJ-2606',
        'expiry_date' => '2028-03-31',
        'stock_quantity' => 18,
        'description' => 'Veterinary antiparasitic injection for clinic use only under veterinarian supervision.',
        'price' => 1900.00,
        'requires_prescription' => 1,
        'delivery_available' => 0,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Amoxicillin Clavulanate Tablets',
        'manufacturer' => 'VetMeds',
        'batch_number' => 'AMC-TAB-2610',
        'expiry_date' => '2028-10-15',
        'stock_quantity' => 24,
        'description' => 'Antibiotic tablets dispensed only after veterinarian assessment and dosage guidance.',
        'price' => 1650.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Meloxicam Oral Suspension',
        'manufacturer' => 'VetRelief',
        'batch_number' => 'MEL-SUS-2609',
        'expiry_date' => '2028-09-30',
        'stock_quantity' => 15,
        'description' => 'Pain and inflammation support for pets. Use only with vet dosage instructions.',
        'price' => 2450.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Probiotic Digestive Paste',
        'manufacturer' => 'PetGut',
        'batch_number' => 'PGP-2606',
        'expiry_date' => '2027-10-30',
        'stock_quantity' => 27,
        'description' => 'Digestive support paste for dogs and cats during diet changes or stomach upset.',
        'price' => 2100.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Omega 3 Skin & Coat Capsules',
        'manufacturer' => 'CoatWell',
        'batch_number' => 'OMG-CAP-2606',
        'expiry_date' => '2028-05-20',
        'stock_quantity' => 34,
        'description' => 'Omega fatty acid supplement for healthy skin, coat shine, and daily wellness.',
        'price' => 2850.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Calcium Plus Puppy Supplement',
        'manufacturer' => 'NutriPaws',
        'batch_number' => 'CAL-PUP-2606',
        'expiry_date' => '2028-06-30',
        'stock_quantity' => 25,
        'description' => 'Calcium and vitamin support for growing puppies after clinic recommendation.',
        'price' => 2350.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Dental Chews Small Breed',
        'manufacturer' => 'DentaPaws',
        'batch_number' => 'DCH-SB-2606',
        'expiry_date' => '2027-12-15',
        'stock_quantity' => 48,
        'description' => 'Daily dental chews for small dogs to help reduce plaque and freshen breath.',
        'price' => 1750.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Pet Toothbrush & Enzymatic Paste Kit',
        'manufacturer' => 'DentaPaws',
        'batch_number' => 'TBK-2606',
        'expiry_date' => '2028-01-31',
        'stock_quantity' => 36,
        'description' => 'Home dental care kit with soft brush and enzymatic toothpaste for pets.',
        'price' => 1950.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Tear Stain Remover Wipes',
        'manufacturer' => 'CleanPaws',
        'batch_number' => 'TSW-2606',
        'expiry_date' => '2028-02-15',
        'stock_quantity' => 30,
        'description' => 'Gentle grooming wipes for cleaning tear stains and facial folds.',
        'price' => 1250.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Tick & Flea Shampoo',
        'manufacturer' => 'PetDerm Labs',
        'batch_number' => 'TFS-2606',
        'expiry_date' => '2028-04-30',
        'stock_quantity' => 29,
        'description' => 'Medicated shampoo for external parasite control and routine coat cleansing.',
        'price' => 2150.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Paw Balm Moisturizer',
        'manufacturer' => 'SoftPaw',
        'batch_number' => 'PBM-2606',
        'expiry_date' => '2028-03-20',
        'stock_quantity' => 33,
        'description' => 'Moisturizing balm for dry paw pads, elbows, and minor rough skin areas.',
        'price' => 1350.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Elizabethan Recovery Collar',
        'manufacturer' => 'PetSafe',
        'batch_number' => 'ERC-2606',
        'expiry_date' => null,
        'stock_quantity' => 21,
        'description' => 'Protective recovery collar to prevent licking or biting after surgery or wounds.',
        'price' => 1600.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Pet Harness Medium',
        'manufacturer' => 'WalkMate',
        'batch_number' => 'HRN-M-2606',
        'expiry_date' => null,
        'stock_quantity' => 24,
        'description' => 'Comfort-fit medium harness for safer walks and better leash control.',
        'price' => 2850.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Retractable Dog Leash',
        'manufacturer' => 'WalkMate',
        'batch_number' => 'RDL-2606',
        'expiry_date' => null,
        'stock_quantity' => 19,
        'description' => 'Durable retractable leash for controlled outdoor walks.',
        'price' => 2450.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Stainless Steel Pet Bowl',
        'manufacturer' => 'HomePaws',
        'batch_number' => 'SSB-2606',
        'expiry_date' => null,
        'stock_quantity' => 45,
        'description' => 'Easy-clean stainless steel bowl for food or water.',
        'price' => 950.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Cat Carrier Medium',
        'manufacturer' => 'TravelPaws',
        'batch_number' => 'CCM-2606',
        'expiry_date' => null,
        'stock_quantity' => 12,
        'description' => 'Ventilated medium cat carrier for clinic visits and safe travel.',
        'price' => 5200.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Absorbent Puppy Training Pads',
        'manufacturer' => 'CleanPaws',
        'batch_number' => 'PTP-2606',
        'expiry_date' => null,
        'stock_quantity' => 50,
        'description' => 'Disposable training pads for puppies, senior pets, and post-treatment care.',
        'price' => 2100.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Disinfectant Kennel Cleaner',
        'manufacturer' => 'VetClean',
        'batch_number' => 'DKC-2606',
        'expiry_date' => '2028-06-30',
        'stock_quantity' => 18,
        'description' => 'Clinic-grade disinfectant cleaner for kennels, floors, and pet areas.',
        'price' => 3250.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Urine Odor Remover Spray',
        'manufacturer' => 'VetClean',
        'batch_number' => 'UOR-2606',
        'expiry_date' => '2028-05-31',
        'stock_quantity' => 31,
        'description' => 'Enzyme-based spray for cleaning pet urine stains and odors.',
        'price' => 1750.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Royal Canin Gastrointestinal Dog Food',
        'manufacturer' => 'Royal Canin',
        'batch_number' => 'RC-GI-2606',
        'expiry_date' => '2027-11-30',
        'stock_quantity' => 13,
        'description' => 'Veterinary diet for digestive support. Best used with clinic recommendation.',
        'price' => 9800.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Urinary Care Cat Food',
        'manufacturer' => 'VetDiet',
        'batch_number' => 'UCF-2606',
        'expiry_date' => '2027-10-31',
        'stock_quantity' => 17,
        'description' => 'Cat food formulated for urinary tract support after veterinary advice.',
        'price' => 7600.00,
        'requires_prescription' => 1,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Kitten Milk Replacer',
        'manufacturer' => 'NutriPaws',
        'batch_number' => 'KMR-2606',
        'expiry_date' => '2027-09-30',
        'stock_quantity' => 22,
        'description' => 'Milk replacer powder for orphaned or supplemental feeding of kittens.',
        'price' => 3450.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=900&q=80',
    ],
    [
        'product_name' => 'Puppy Milk Replacer',
        'manufacturer' => 'NutriPaws',
        'batch_number' => 'PMR-2606',
        'expiry_date' => '2027-09-30',
        'stock_quantity' => 20,
        'description' => 'Milk replacer powder for puppies needing supplemental feeding.',
        'price' => 3550.00,
        'requires_prescription' => 0,
        'delivery_available' => 1,
        'photo_url' => 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80',
    ],
];

function productNameHasAny(string $haystack, array $needles): bool
{
    foreach ($needles as $needle) {
        if (strpos($haystack, $needle) !== false) {
            return true;
        }
    }
    return false;
}

function onlineProductImage(array $product): string
{
    $text = strtolower($product['product_name'] . ' ' . ($product['description'] ?? ''));

    if (productNameHasAny($text, ['vaccine', 'injection', 'clinic-administered'])) {
        return 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['tablet', 'capsule', 'dewormer', 'meloxicam', 'amoxicillin', 'probiotic', 'supplement', 'paste'])) {
        return 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['cat food', 'kitten', 'cat litter', 'carrier'])) {
        return 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['food', 'milk replacer', 'dental chews'])) {
        return 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['shampoo', 'wipes', 'balm', 'toothbrush', 'grooming'])) {
        return 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['collar', 'harness', 'leash', 'bowl'])) {
        return 'https://images.unsplash.com/photo-1601758064224-c3c24a19333d?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['cleaner', 'odor', 'pads', 'ear cleanser'])) {
        return 'https://images.unsplash.com/photo-1623387641168-d9803ddd3f35?auto=format&fit=crop&w=900&q=80';
    }

    if (productNameHasAny($text, ['wound', 'antiseptic', 'recovery'])) {
        return 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=900&q=80';
    }

    return $product['photo_url'];
}

$productStmt = $pdo->prepare('
    INSERT INTO vaccination_products
      (product_name, manufacturer, batch_number, expiry_date, stock_quantity, description, price, is_customer_visible, requires_prescription, delivery_available)
    VALUES
      (:product_name, :manufacturer, :batch_number, :expiry_date, :stock_quantity, :description, :price, 1, :requires_prescription, :delivery_available)
    ON DUPLICATE KEY UPDATE
      manufacturer = VALUES(manufacturer),
      batch_number = VALUES(batch_number),
      expiry_date = VALUES(expiry_date),
      stock_quantity = VALUES(stock_quantity),
      description = VALUES(description),
      price = VALUES(price),
      is_customer_visible = 1,
      requires_prescription = VALUES(requires_prescription),
      delivery_available = VALUES(delivery_available),
      updated_at = CURRENT_TIMESTAMP
');

$selectStmt = $pdo->prepare('SELECT product_id FROM vaccination_products WHERE product_name = :product_name LIMIT 1');
$clearPhotoStmt = $pdo->prepare('UPDATE product_photos SET is_primary = 0 WHERE product_id = :product_id');
$photoStmt = $pdo->prepare('INSERT INTO product_photos (product_id, photo_url, is_primary) VALUES (:product_id, :photo_url, 1)');

echo "Adding sample products...\n";

foreach ($products as $product) {
    $productStmt->execute([
        ':product_name' => $product['product_name'],
        ':manufacturer' => $product['manufacturer'],
        ':batch_number' => $product['batch_number'],
        ':expiry_date' => $product['expiry_date'],
        ':stock_quantity' => $product['stock_quantity'],
        ':description' => $product['description'],
        ':price' => $product['price'],
        ':requires_prescription' => $product['requires_prescription'],
        ':delivery_available' => $product['delivery_available'],
    ]);

    $selectStmt->execute([':product_name' => $product['product_name']]);
    $productId = (int)$selectStmt->fetchColumn();
    $clearPhotoStmt->execute([':product_id' => $productId]);
    $photoStmt->execute([
        ':product_id' => $productId,
        ':photo_url' => onlineProductImage($product),
    ]);

    echo "Added {$product['product_name']} with stock {$product['stock_quantity']}\n";
}

echo "Done. Products are visible on the public page and Products page.\n";
