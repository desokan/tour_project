class APIFeatures {
  constructor(queryFind, queryString) {
    this.queryFind = queryFind;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    const { price,minPrice, maxPrice, difficulty, duration, minDuration, maxDuration } = queryObj;
    const newQuery = {};

    if (difficulty) {
      newQuery.difficulty = difficulty;
    }

    if (duration) {
      newQuery.duration = duration;
    }

    if (minDuration && maxDuration) {
      newQuery.duration = {
        $gte: Number(minDuration),
        $lte: Number(maxDuration),
      };
    } else if (minDuration) {
      newQuery.duration = { $gte: Number(minDuration) };
    } else if (maxDuration) {
      newQuery.duration = { $lte: Number(maxDuration) };
    }

    if (price) {
      newQuery.price = price;
    }

    if (minPrice && maxPrice) {
      newQuery.price = {
        $gte: Number(minPrice),
        $lte: Number(maxPrice),
      };
    } else if (minPrice) {
      newQuery.price = { $gte: Number(minPrice) };
    } else if (maxPrice) {
      newQuery.price = { $lte: Number(maxPrice) };
    }

    this.queryFind = this.queryFind.find(newQuery);

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.queryFind = this.queryFind.sort(sortBy);
    } else {
      this.queryFind = this.queryFind.sort("-createdAt");
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.queryFind = this.queryFind.select(fields);
    } else {
      this.queryFind = this.queryFind.select("-__v");
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.queryFind = this.queryFind.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
