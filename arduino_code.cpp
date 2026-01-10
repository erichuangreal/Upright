#include <Wire.h>
#include <math.h>

// Grove 3-Axis Digital Accelerometer ±1.5g v1.3 (MMA7660)
// I2C address you detected: 0x4C

#define MMA7660_ADDR ((uint8_t)0x4C)

// MMA7660 registers
#define REG_XOUT ((uint8_t)0x00)
#define REG_YOUT ((uint8_t)0x01)
#define REG_ZOUT ((uint8_t)0x02)
#define REG_MODE ((uint8_t)0x07)
#define REG_SR   ((uint8_t)0x08)

static inline uint8_t read8(uint8_t reg) {
  Wire.beginTransmission(MMA7660_ADDR);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)MMA7660_ADDR, (uint8_t)1);
  if (!Wire.available()) return 0xFF;
  return Wire.read();
}

static inline void write8(uint8_t reg, uint8_t val) {
  Wire.beginTransmission(MMA7660_ADDR);
  Wire.write(reg);
  Wire.write(val);
  Wire.endTransmission();
}

// MMA7660 gives 6-bit signed (-32..31) in bits[5:0]
static inline int8_t decode6(uint8_t raw) {
  raw &= 0x3F;
  if (raw & 0x20) raw = raw - 0x40; // sign extend
  return (int8_t)raw;
}

static inline bool readXYZ6(int8_t &x6, int8_t &y6, int8_t &z6) {
  uint8_t rx = read8(REG_XOUT);
  uint8_t ry = read8(REG_YOUT);
  uint8_t rz = read8(REG_ZOUT);

  if (rx == 0xFF || ry == 0xFF || rz == 0xFF) return false;

  x6 = decode6(rx);
  y6 = decode6(ry);
  z6 = decode6(rz);
  return true;
}

static inline float ema(float prev, float cur, float alpha) {
  return alpha * cur + (1.0f - alpha) * prev;
}

void setup() {
  Wire.begin();
  Serial.begin(115200);
  delay(200);

  // Standby -> set sample rate -> active
  write8(REG_MODE, 0x00);
  write8(REG_SR,   0x00); // fast sample rate (datasheet: 120 Hz)
  write8(REG_MODE, 0x01);

  Serial.println("MMA7660 streaming raw accel + pitch JSON @ ~20Hz");
}

void loop() {
  static bool hasPrev = false;
  static float pitchSmoothPrev = 0.0f;
  static float pitchPrev = 0.0f;
  static unsigned long tPrev = 0;

  const unsigned long tNow = millis();
  float dt = (tPrev == 0) ? 0.05f : (float)(tNow - tPrev) / 1000.0f; // seconds
  if (dt <= 0.0f) dt = 0.05f;

  int8_t x6, y6, z6;
  if (!readXYZ6(x6, y6, z6)) {
    Serial.print("{\"error\":\"read_failed\",\"ts\":");
    Serial.print(tNow);
    Serial.println("}");
    delay(50);
    return;
  }

  // MMA7660 is ±1.5g mapped to 6-bit signed => ~21.33 counts per g (approx).
  // For posture angles, absolute scaling isn't critical; ratios matter.
  const float COUNTS_PER_G = 21.33f;

  float ax = x6 / COUNTS_PER_G;
  float ay = y6 / COUNTS_PER_G;
  float az = z6 / COUNTS_PER_G;

  float pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0f / PI;
  float roll  = atan2( ay, az ) * 180.0f / PI;
  float a_mag = sqrt(ax * ax + ay * ay + az * az);

  if (!hasPrev) {
    pitchPrev = pitch;
    pitchSmoothPrev = pitch;
    hasPrev = true;
  }

  // Smoothed pitch (EMA)
  const float ALPHA = 0.25f; // 0.1 smoother, 0.3 more responsive
  float pitch_smooth = ema(pitchSmoothPrev, pitch, ALPHA);
  pitchSmoothPrev = pitch_smooth;

  // Pitch rate (deg/s)
  float dpitch = (pitch - pitchPrev) / dt;
  pitchPrev = pitch;
  tPrev = tNow;

  // JSON line (one per sample)
  Serial.print("{\"ax\":");           Serial.print(ax, 4);
  Serial.print(",\"ay\":");          Serial.print(ay, 4);
  Serial.print(",\"az\":");          Serial.print(az, 4);
  Serial.print(",\"pitch\":");       Serial.print(pitch, 2);
  Serial.print(",\"pitch_smooth\":");Serial.print(pitch_smooth, 2);
  Serial.print(",\"roll\":");        Serial.print(roll, 2);
  Serial.print(",\"a_mag\":");       Serial.print(a_mag, 4);
  Serial.print(",\"dpitch\":");      Serial.print(dpitch, 2);
  Serial.print(",\"ts\":");          Serial.print(tNow);
  Serial.println("}");

  delay(50); // ~20 Hz
}