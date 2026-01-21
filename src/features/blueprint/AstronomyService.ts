import * as Astronomy from 'astronomy-engine';

export interface CelestialPosition {
    body: string;
    longitude: number;
    latitude: number;
    distance: number;
    speed: number;
    sign: string;
    house?: number;
}

export interface BirthChart {
    date: Date;
    location: {
        lat: number;
        lng: number;
    };
    positions: CelestialPosition[];
    houses: number[];
}

const ZODIAC_SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export class AstronomyService {
    static calculateChart(date: Date, lat: number, lng: number): BirthChart {
        const observer = new Astronomy.Observer(lat, lng, 0);

        // 1. Calculate Planets
        const bodies = [
            Astronomy.Body.Sun,
            Astronomy.Body.Moon,
            Astronomy.Body.Mercury,
            Astronomy.Body.Venus,
            Astronomy.Body.Mars,
            Astronomy.Body.Jupiter,
            Astronomy.Body.Saturn,
            Astronomy.Body.Uranus,
            Astronomy.Body.Neptune,
            Astronomy.Body.Pluto
        ];

        const positions: CelestialPosition[] = bodies.map(body => {
            const equator = Astronomy.Equator(body, date, observer, true, true);
            const ecliptic = Astronomy.Ecliptic(equator.vec);
            return {
                body: body,
                longitude: ecliptic.elon,
                latitude: ecliptic.elat,
                distance: equator.dist,
                speed: 0,
                sign: this.getSign(ecliptic.elon)
            };
        });

        // 2. Calculate Angles (Ascendant & MC)
        // Calculate Local Sidereal Time (LST)
        const dateDay = new Astronomy.AstroTime(date);
        const gmst = Astronomy.SiderealTime(dateDay);
        const lst = (gmst + lng / 15.0) % 24; // Hours
        const ramc = lst * 15.0; // Degrees

        // Calculate Obliquity of Ecliptic manually since Astronomy.Obliquity is missing in this version
        const tCentury = dateDay.ut / 36525.0; // Julian centuries since J2000.0
        const obliquity = 23.4392911 - (46.8150 * tCentury + 0.00059 * tCentury * tCentury - 0.001813 * tCentury * tCentury * tCentury) / 3600.0;
        const eps = obliquity * Math.PI / 180;
        const latRad = lat * Math.PI / 180;
        const ramcRad = ramc * Math.PI / 180;

        // MC Calculation
        let mcRad = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(eps));
        if (mcRad < 0) mcRad += 2 * Math.PI;
        const mcDeg = mcRad * 180 / Math.PI;

        // Ascendant Calculation
        let ascRad = Math.atan2(
            Math.cos(ramcRad),
            -Math.sin(ramcRad) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps)
        );
        if (ascRad < 0) ascRad += 2 * Math.PI;
        const ascDeg = ascRad * 180 / Math.PI;

        positions.push({
            body: 'Ascendant',
            longitude: ascDeg,
            latitude: 0,
            distance: 0,
            speed: 0,
            sign: this.getSign(ascDeg)
        });

        positions.push({
            body: 'MC',
            longitude: mcDeg,
            latitude: 0,
            distance: 0,
            speed: 0,
            sign: this.getSign(mcDeg)
        });

        // IC is opposite MC
        const icDeg = (mcDeg + 180) % 360;
        positions.push({
            body: 'IC',
            longitude: icDeg,
            latitude: 0,
            distance: 0,
            speed: 0,
            sign: this.getSign(icDeg)
        });

        // 3. Calculate North Node (Mean)
        // Simplified formula for Mean Node (astronomy-engine might not have a direct simple function for this in the enum)
        // Using a known epoch: J2000.0
        const t = dateDay.ut / 36525.0; // Julian centuries since J2000.0
        let nodeLong = 125.04452 - 1934.136261 * t + 0.0020708 * t * t + t * t * t / 450000;
        nodeLong = nodeLong % 360;
        if (nodeLong < 0) nodeLong += 360;

        positions.push({
            body: 'NorthNode',
            longitude: nodeLong,
            latitude: 0,
            distance: 0,
            speed: 0,
            sign: this.getSign(nodeLong)
        });

        // South Node is opposite North Node
        const southNodeLong = (nodeLong + 180) % 360;
        positions.push({
            body: 'SouthNode',
            longitude: southNodeLong,
            latitude: 0,
            distance: 0,
            speed: 0,
            sign: this.getSign(southNodeLong)
        });

        // 4. Houses (Equal House System for simplicity/robustness)
        const houses = Array(12).fill(0).map((_, i) => (ascDeg + i * 30) % 360);

        return {
            date,
            location: { lat, lng },
            positions,
            houses
        };
    }

    private static getSign(longitude: number): string {
        const signIndex = Math.floor(longitude / 30);
        return ZODIAC_SIGNS[signIndex % 12];
    }
}
